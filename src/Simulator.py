from copy import deepcopy
import threading
import cherrypy
import os
from Queue import Queue
from json import dumps, load
from SimulatorThread import SimulatorThread


__author__ = 'jon'


# Index of log messages for each thread
serverLock = threading.Lock()

# Global counter to allow us to assign unique ids to new clients
nextClientId = 1

clientSimulatorMap = {}

class Simulator(object):
    """
      Provides a web interface for log trace simulations
    """

    @cherrypy.expose
    def index(self):
        """
          Just return the static HTML content
        """
        return open(os.path.join(STATIC_DIR, 'index.html')).read()


    @cherrypy.expose
    def subscribe(self):
        """
          Subscribes a client to subscribe for log updates, returning the client's assigned id

            @return the client id
        """

        serverLock.acquire()

        # Get this client's id
        global nextClientId
        clientId = nextClientId
        nextClientId += 1

        clientSimulatorMap[clientId] = simulatorThread
        simulatorThread.addClient(clientId)

        # Get the current system state
        currentState = deepcopy(simulatorThread.currentState())

        serverLock.release()

        # Respond to the client's id
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return dumps({
            'clientId': clientId,
            'currentState': currentState,
            'structure': networkTopology['structure']
        })

    @cherrypy.expose
    def changeSimulator(self, clientId, simulator):
        clientId = int(clientId)

        serverLock.acquire()

        if clientId not in clientSimulatorMap:
            serverLock.release()
            return dumps({
                'message': 'clientId should be a valid integer client id',
                'successful': False
            })

        if simulator == "random":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = simulatorThread
            clientSimulatorMap[clientId].addClient(clientId)
        elif simulator == "heterogeneous":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = heterogeneousSimulatorThread
            clientSimulatorMap[clientId].addClient(clientId)
        else:
            serverLock.release()
            return dumps({
                'message': 'unknown simulator',
                'successful': False
            })

        serverLock.release()
        return  dumps({
            'successful': True
        })

    @cherrypy.expose
    def unsubscribe(self, clientId):
        """
          Removes a client from the log stream
        """
        clientId = int(clientId)

        serverLock.acquire()

        try:
            clientSimulatorMap[clientId].removeClient(clientId)
            del clientSimulatorMap[clientId]

            # Send back the status of the unsubscribe request
            cherrypy.response.headers['Content-Type'] = 'application/json'
            returnMessage = dumps({
                'successful': True
            })

        except ValueError:
            # Send back the status of the unsubscribe request
            cherrypy.response.headers['Content-Type'] = 'application/json'
            returnMessage = dumps({
                'message': 'clientId should be a valid integer client id',
                'successful': False
            })

        except KeyError:
            # Send back the status of the unsubscribe request
            cherrypy.response.headers['Content-Type'] = 'application/json'
            returnMessage = dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        serverLock.release()
        return returnMessage


    @cherrypy.expose
    def update(self, clientId):
        """
          Updates the client with the latest set of messages added by the log simulator
            (blocks until the SimulatorThread hits the semaphore for this client)
        """
        clientId = int(clientId)

        serverLock.acquire()

        if clientId not in clientSimulatorMap:
            serverLock.release()
            return dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        # obtain client lock
        simulator = clientSimulatorMap[clientId]
        serverLock.release()

        # wait for data to be available
        logData = simulator.getNextLog(clientId)

        if logData is None:
            return dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        # take off one log entry off the queue
        logEntries = logData['events']
        print logEntries

        # get the state change of the cluster
        stateChange = logData['stateChange']

        return dumps({
            'events' : logEntries,
            'stateChange': stateChange,
            'successful': True
        })


# Server configuration
STATIC_DIR = os.path.join(os.path.abspath('../'), 'static')
config = {
    '/static': {
      'tools.staticdir.on': True,
      'tools.staticdir.dir': STATIC_DIR,
    }
}

# Start the server
cherrypy.tree.mount(Simulator(), '/', config=config)
cherrypy.engine.start()

# Load the network topology
networkTopology = load(open(os.path.join(STATIC_DIR, 'data/topology.json')))

# Start the simulator thread
simulatorThread = SimulatorThread(networkTopology['machines'])
simulatorThread.start()

heterogeneousNetworkTopology = load(open(os.path.join(STATIC_DIR, 'data/heterogeneousTopology.json')))
heterogeneousSimulatorThread = SimulatorThread(heterogeneousNetworkTopology['machines'])
heterogeneousSimulatorThread.start()

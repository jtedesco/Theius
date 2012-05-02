import os, sys


path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if not path in sys.path:
    sys.path.insert(1, path)
del path

from copy import deepcopy
import threading
import cherrypy
from json import dumps, load
from src.simulator.RandomSimulator import RandomSimulator
from src.simulator.mapReduce.MapReduceSimulator import MapReduceSimulator
from src.simulator.scenarios.UnevenLoadSimulator import UnevenLoadSimulator
from src.simulator.DefaultSimulator import DefaultSimulator
from src.simulator.scenarios.RackFailureSimulator import RackFailureSimulator
from src.simulator.scenarios.IndividualMachineFailureSimulator import IndividualMachineFailureSimulator
from src.LargeTopology import makeLargeTopology

__author__ = 'roman'

# Index of log messages for each thread
serverLock = threading.Lock()

# Global counter to allow us to assign unique ids to new clients
nextClientId = 1

# Global map from clientId to the simulator they are currently using
clientSimulatorMap = {}

class SimulatorInterface(object):
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
          Subscribes a client to subscribe for log updates, returning the client's assigned id,
          and information about the current state of the cluster
        """

        serverLock.acquire()

        # Get this client's id
        global nextClientId
        clientId = nextClientId
        nextClientId += 1

        # Assign this client the default simulator
        simulator = randomSimulator
        clientSimulatorMap[clientId] = simulator
        simulator.addClient(clientId)

        # Get the current system state
        currentState = deepcopy(simulator.state())
        currentStructure = deepcopy(simulator.topology())

        serverLock.release()

        # Respond with client's id
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return dumps({
            'clientId': clientId,
            'currentState': currentState,
            'structure': currentStructure
        })

    @cherrypy.expose
    def changeSimulator(self, clientId, simulator):
        """
            Changes the client to use a different simulator
        """
        clientId = int(clientId)

        serverLock.acquire()

        # client not subscribed, error
        if clientId not in clientSimulatorMap:
            serverLock.release()
            return dumps({
                'message': 'clientId should be a valid integer client id',
                'successful': False
            })

        if simulator == "random":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = randomSimulator
            clientSimulatorMap[clientId].addClient(clientId)

        elif simulator == "heterogeneous":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = heterogeneousSimulator
            clientSimulatorMap[clientId].addClient(clientId)

        elif simulator == "largeCluster":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = largeClusterSimulator
            clientSimulatorMap[clientId].addClient(clientId)

        elif simulator == "uneven":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = unevenLoadSimulator
            clientSimulatorMap[clientId].addClient(clientId)

        elif simulator == "individual":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = individualFailureSimulator
            clientSimulatorMap[clientId].addClient(clientId)

        elif simulator == "rack":
            clientSimulatorMap[clientId].removeClient(clientId)
            clientSimulatorMap[clientId] = rackFailureSimulator
            clientSimulatorMap[clientId].addClient(clientId)

        # could not find name of simulator
        else:
            serverLock.release()
            return dumps({
                'message': 'unknown simulator',
                'successful': False
            })

        # Get the current system state
        currentState = deepcopy(clientSimulatorMap[clientId].state())
        currentStructure = deepcopy(clientSimulatorMap[clientId].topology())

        serverLock.release()
        return  dumps({
            'successful': True,
            'currentState': currentState,
            'structure': currentStructure
        })

    @cherrypy.expose
    def update(self, clientId):
        """
          Updates the client with the latest set of messages added by the log simulator
            (blocks until the SimulatorThread hits the semaphore for this client)
        """
        clientId = int(clientId)

        serverLock.acquire()

        # client not subscribed, error
        if clientId not in clientSimulatorMap:
            serverLock.release()
            return dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        # obtain client's simulator
        simulator = clientSimulatorMap[clientId]
        serverLock.release()

        # wait for data to be available
        logData = simulator.getNextLog(clientId)

        if logData is None:
            return dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        return dumps({
            'cluster' : logData['cluster'],
            'mapReduce': logData['mapReduce'],
            'time': simulator.getTime(),
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
cherrypy.tree.mount(SimulatorInterface(), '/', config=config)
cherrypy.engine.start()

# Start the default simulator
networkTopology = load(open(os.path.join(STATIC_DIR, 'data/topology.json')))
randomSimulator = DefaultSimulator(RandomSimulator(networkTopology['machines']), networkTopology['structure'], MapReduceSimulator(networkTopology['machines']))
randomSimulator.start()

# Start the heterogeneous cluster simulator
heterogeneousNetworkTopology = load(open(os.path.join(STATIC_DIR, 'data/heterogeneousTopology.json')))
heterogeneousSimulator = DefaultSimulator(RandomSimulator(heterogeneousNetworkTopology['machines']), heterogeneousNetworkTopology['structure'], MapReduceSimulator(heterogeneousNetworkTopology['machines']))
heterogeneousSimulator.start()

# Start the large topology cluster simulator
largeClusterTopology = makeLargeTopology()
largeClusterSimulator = DefaultSimulator(RandomSimulator(largeClusterTopology['machines']), largeClusterTopology['structure'], MapReduceSimulator(largeClusterTopology['machines']))
largeClusterSimulator.start()

# Start the uneven CPU load simulator
unevenLoadSimulator = DefaultSimulator(UnevenLoadSimulator(networkTopology['machines']), networkTopology['structure'], MapReduceSimulator(networkTopology['machines']))
unevenLoadSimulator.start()

# Start the Individual Nodes prone to failure Simulator
individualFailureSimulator = DefaultSimulator(IndividualMachineFailureSimulator(networkTopology['machines']), networkTopology['structure'], MapReduceSimulator(networkTopology['machines']))
individualFailureSimulator.start()

#Start the One rack prone to failure simulator
rackFailureSimulator = DefaultSimulator(RackFailureSimulator(networkTopology['machines']), networkTopology['structure'], MapReduceSimulator(networkTopology['machines']))
rackFailureSimulator.start()
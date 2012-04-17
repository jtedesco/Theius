import threading
import cherrypy
import os
from Queue import Queue
from json import dumps
from SimulatorThread import SimulatorThread


__author__ = 'jon'


# Index of log messages for each thread
logMessages = {}
serverLock = threading.Lock()

# Global counter to allow us to assign unique ids to new clients
nextClientId = 1


class Simulator(object):
    """
      Provides a web interface for log trace simulations
    """

    @cherrypy.expose
    def index(self):
        """
          Just return the static HTML content
        """
        return open(os.path.join(STATIC_DIR, u'index.html')).read()


    @cherrypy.expose
    def subscribe(self):
        """
          Subscribes a client to subscribe for log updates, returning the client's assigned id

            @return the client id
        """

        global serverLock
        serverLock.acquire()

        # Get this client's id
        global nextClientId
        clientId = nextClientId
        nextClientId += 1

        logMessages[clientId] = {
            'updates' : Queue(),
            'trigger' : threading.Semaphore()
        }

        # acquire the client lock immediately, indicating no messages are ready to be processed
        logMessages[clientId]['trigger'].acquire()

        serverLock.release()

        # Respond to the client's id
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return dumps({
            'clientId': clientId
        })

    @cherrypy.expose
    def structure(self):
        """
            for now, returns a static JSON string of the node structure
        """
        return open(os.path.join(STATIC_DIR, u'data/structure.json')).read()

    @cherrypy.expose
    def unsubscribe(self, clientId):
        """
          Removes a client from the log stream
        """

        global serverLock
        serverLock.acquire()

        try:
            logMessages[int(clientId)]['trigger'].release()
            del logMessages[int(clientId)]

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

        global serverLock
        serverLock.acquire()

        if clientId not in logMessages:
            serverLock.release()
            return dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        # obtain client lock
        clientLock = logMessages[clientId]['trigger']
        serverLock.release()

        # wait for data to be available
        clientLock.acquire()

        serverLock.acquire()

        if clientId not in logMessages:
            serverLock.release()
            return dumps({
                'message': 'Not subscribed',
                'successful': False
            })

        # take off one log entry off the queue
        logData = logMessages[clientId]
        logEntries = []
        logEntry = logData['updates'].get()
        logEntries.append(logEntry)

        serverLock.release()

        logUpdates = dumps(logEntries)
        return dumps({
            'updates' : logUpdates,
            'successful': True
        })


# Server configuration
STATIC_DIR = os.path.join(os.path.abspath("../"), u"static")
config = {
    '/static': {
      'tools.staticdir.on': True,
      'tools.staticdir.dir': STATIC_DIR,
    }
}

# Start the server
cherrypy.tree.mount(Simulator(), '/', config=config)
cherrypy.engine.start()

# Start the simulator thread
simulatorThread = SimulatorThread(logMessages, serverLock)
simulatorThread.start()

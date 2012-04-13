import threading
import cherrypy
import os
from Queue import Queue
from json import dumps
from SimulatorThread import SimulatorThread


__author__ = 'jon'


# Index of log messages for each thread
logMessages = {}
logMessagesLock = threading.Lock()

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

        # Get this client's id
        global nextClientId
        clientId = nextClientId
        nextClientId += 1

        global logMessagesLock
        logMessagesLock.acquire()
        logMessages[clientId] = {
            'updates' : Queue(),
            'clientId' : clientId,
            'trigger' : threading.Semaphore()
        }
        logMessagesLock.release()

        # Respond to the client's id
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return dumps({
            'clientId': clientId,
            'successful': True
        })


    @cherrypy.expose
    def unsubscribe(self, clientId):
        """
          Removes a client from the log stream
        """

        global logMessagesLock
        logMessagesLock.acquire()

        del logMessagesLock[clientId]
        logMessagesLock.release()

        # Send back the status of the unsubscribe request
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return dumps({
            'successful': True
        })


    @cherrypy.expose
    def update(self, clientId):
        """
          Updates the client with the latest set of messages added by the log simulator
        """

        pass


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
simulatorThread = SimulatorThread(logMessages, logMessagesLock)
simulatorThread.start()

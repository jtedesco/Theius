from Queue import Queue
import threading

__author__ = 'Roman'

class BaseSimulator(threading.Thread):
    """
        This is an Abstract Class
        Simulators should extend this class
        This class encapsulates client handling logic and log handling logic. Subclasses
        should not have to worry about locks
    """

    def __init__(self):
        """
            Initializes the simulator
        """

        threading.Thread.__init__(self)

        # map from clientId to information about the client (see addClient for more information)
        self.clientMap = {}

        # a lock for this class
        self.simulatorLock = threading.Lock()

    def getNextLog(self, clientId):
        """
            Given a clientId, this method returns the next log for that client.
            Note: This method is blocking, and will only return once a log is available
        """
        self.simulatorLock.acquire()

        if clientId in self.clientMap:

            queue = self.clientMap[clientId]

            # wait for data (semaphore will release when data is available)
            # note that we don't want to wait with the simulatorLock locked
            self.simulatorLock.release()
            return queue.get()

        self.simulatorLock.release()
        return None

    def addClient(self, clientId):
        """
            adds a client to this simulator
        """
        self.simulatorLock.acquire()
        self.clientMap[clientId] = Queue();
        self.simulatorLock.release()

    def addLog(self, log):
        """
            adds a log to this simulator
        """
        self.simulatorLock.acquire()

        toRemove = []
        for clientId in self.clientMap:
            queue = self.clientMap[clientId]
            queue.put(log)

            if queue.qsize() > 25:
                toRemove.append(clientId)

        self.simulatorLock.release()

        for clientId in toRemove:
            self.removeClient(clientId)

    def removeClient(self, clientId):
        """
            removes the client from this simulator, releasing all associated resources
        """
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            self.clientMap[clientId].put(None);
            del self.clientMap[clientId]

        self.simulatorLock.release()

    def run(self):
        """
            Abstract method
        """
        raise NotImplementedError("Must override method 'run' first")

    def state(self):
        """
            Abstract method
            Returns the current state of the cluster
        """
        raise NotImplementedError("Must override method 'state' first")

    def topology(self):
        """
            Abstract method
            Returns the current structure of the cluster
        """
        raise NotImplementedError("Must override method 'topology' first")

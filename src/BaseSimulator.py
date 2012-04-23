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

        # an array of all logs created by this simulator
        self.logs = []

        # the next index to be used for the next log that is added
        self.currentLogIndex = 0

        # a lock for this class
        self.simulatorLock = threading.Lock()

    def getNextLog(self, clientId):
        """
            Given a clientId, this method returns the next log for that client.
            Note: This method is blocking, and will only return once a log is available
        """
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            trigger = self.clientMap[clientId]['trigger']

            # wait for data (semaphore will release when data is available)
            # note that we don't want to wait with the simulatorLock locked
            self.simulatorLock.release()
            trigger.acquire()
            self.simulatorLock.acquire()

            if clientId not in self.clientMap:
                self.simulatorLock.release()
                return None

            # get the log, update client data
            index = self.clientMap[clientId]['lastLogSeen'] + 1
            self.clientMap[clientId]['lastLogSeen'] += 1
            log = self.logs[index]

            self.simulatorLock.release()
            return log

        self.simulatorLock.release()
        return None

    def addClient(self, clientId):
        """
            adds a client to this simulator
        """
        self.simulatorLock.acquire()

        self.clientMap[clientId] = {
            'lastLogSeen' : self.currentLogIndex - 1,
            'trigger' : threading.Semaphore(0)
        }

        self.simulatorLock.release()

    def addLog(self, log):
        """
            adds a log to this simulator
        """
        self.simulatorLock.acquire()

        self.logs.append(log)
        self.currentLogIndex += 1
        for clientId in self.clientMap:
            #notify all clients that data is available
            self.clientMap[clientId]['trigger'].release()

        self.simulatorLock.release()

    def removeClient(self, clientId):
        """
            removes the client from this simulator, releasing all associated resources
        """
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            self.clientMap[clientId]['trigger'].release()
            del self.clientMap[clientId]

        self.simulatorLock.release()

    def clientBacklog(self, clientId):
        """
            Returns how far behind the client is on logs. This method could presumably
            be used to determine whether a client has disconnected (that is, when the backlog
            is large, it is most likely that the client disconnected already)
        """
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            backlog = self.currentLogIndex - self.clientMap[clientId]['lastLogSeen']
            self.simulatorLock.release()
            return backlog

        self.simulatorLock.release()

    def run(self):
        """
            Abstract method
        """
        raise NotImplementedError("Must override method 'run' first")

    def currentState(self):
        """
            Abstract method
            Returns the current state of the cluster
        """
        raise NotImplementedError("Must override method 'currentState' first")

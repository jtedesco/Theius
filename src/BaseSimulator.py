import threading

__author__ = 'Roman'

class BaseSimulator(threading.Thread):
    def __init__(self):

        threading.Thread.__init__(self)

        self.clientMap = {}
        self.logs = []
        self.currentLogIndex = 0
        self.simulatorLock = threading.Lock()

    def getNextLog(self, clientId):
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            trigger = self.clientMap[clientId]['trigger']

            self.simulatorLock.release()
            trigger.acquire()
            self.simulatorLock.acquire()

            if clientId not in self.clientMap:
                self.simulatorLock.release()
                return None

            index = self.clientMap[clientId]['lastLogSeen'] + 1
            self.clientMap[clientId]['lastLogSeen'] += 1
            log = self.logs[index]

            self.simulatorLock.release()
            return log

        self.simulatorLock.release()
        return None

    def addClient(self, clientId):
        self.simulatorLock.acquire()

        self.clientMap[clientId] = {
            'lastLogSeen' : self.currentLogIndex - 1,
            'trigger' : threading.Semaphore(0)
        }

        self.simulatorLock.release()

    def addLog(self, log):
        self.simulatorLock.acquire()

        self.logs.append(log)
        self.currentLogIndex += 1
        for clientId in self.clientMap:
            self.clientMap[clientId]['trigger'].release()

        self.simulatorLock.release()

    def removeClient(self, clientId):
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            self.clientMap[clientId]['trigger'].release()
            del self.clientMap[clientId]

        self.simulatorLock.release()

    def clientBacklog(self, clientId):
        self.simulatorLock.acquire()

        if clientId in self.clientMap:
            backlog = self.currentLogIndex - self.clientMap[clientId]['lastLogSeen']
            self.simulatorLock.release()
            return backlog

        self.simulatorLock.release()

    def run(self):
        raise NotImplementedError("Must override method 'run' first")

    def currentState(self):
        raise NotImplementedError("Must override method 'currentState' first")

import threading

__author__ = 'jon'

class SimulatorThread(threading.Thread):


    def __init__(self, logMessages, logMessagesLock):
        """
          Initialize the simulator thread, given the <code>logMessages</code> map and a lock to access it
        """
        threading.Thread.__init__(self)

        self.logMessages = logMessages
        self.logMessagesLock = logMessagesLock


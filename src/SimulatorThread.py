from random import random
import threading
from time import sleep

__author__ = 'jon'

class SimulatorThread(threading.Thread):


    def __init__(self, logMessages, logMessagesLock):
        """
          Initialize the simulator thread, given the <code>logMessages</code> map and a lock to access it
        """
        threading.Thread.__init__(self)

        self.logMessages = logMessages
        self.logMessagesLock = logMessagesLock


    def run(self):
        """
          Runs the simulator thread, at each tick updating all subscribed clients
        """

        logEventNumber = 1
        while True:

            # Insert some random delay between 0 and 1 second
            sleep(random())

            # Get the new log event
            logEvent = {
                'number': logEventNumber,
                'data': 'blah blah'
            }

            self.logMessagesLock.acquire()
            for clientId in self.logMessages:

                # Add the new log event to the client's queue
                self.logMessages[clientId]['updates'].put(logEvent)

                # Notify client that a message has arrived
                self.logMessages[clientId]['trigger'].release()

            self.logMessagesLock.release()

            print "Recorded log event " + str(logEventNumber)

            logEventNumber += 1

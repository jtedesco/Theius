from random import random
import threading
from time import sleep

__author__ = 'jon'

class SimulatorThread(threading.Thread):
    def __init__(self, logMessages, serverLock, keys):
        """
          Initialize the simulator thread, given the <code>logMessages</code> map and a lock to access it
        """

        threading.Thread.__init__(self)

        self.logMessages = logMessages
        self.serverLock = serverLock

        # names of all nodes
        self.keys = keys

        # possible colors for each node
        self.colors = ["red", "yellow", "green"]

        # possible value for each node
        self.values = range(1, 10)

    def run(self):
        """
          Runs the simulator thread, at each tick updating all subscribed clients
        """

        while True:
            # Insert some random delay between 0 and 2 second
            sleep(2 * random())

            # Get the new log event
            logEvent = {
                'name': self.randomElement(self.keys)
            }

            # pick one of the two attributes to update
            if random() < 0.5:
                logEvent['color'] = self.randomElement(self.colors)
            else:
                logEvent['value'] = self.randomElement(self.values)

            # update the logMessages structure
            self.serverLock.acquire()

            for clientId in self.logMessages:

                # Add the new log event to the client's queue
                self.logMessages[clientId]['updates'].put(logEvent)

                # Notify client that a message has arrived
                self.logMessages[clientId]['trigger'].release()

            self.serverLock.release()


    def randomElement(self, array):
        """
            Returns a random element from an array
        """

        index = int(random() * len(array))
        if index == len(array):
            index -= 1
        return array[index]
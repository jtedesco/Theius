from datetime import datetime
import os
from random import random
import threading
from time import sleep
import numpy

__author__ = 'jon'

class SimulatorThread(threading.Thread):
    def __init__(self, logMessages, serverLock, machineNames):
        """
          Initialize the simulator thread, given the <code>logMessages</code> map and a lock to access it
        """

        threading.Thread.__init__(self)

        self.logMessages = logMessages
        self.serverLock = serverLock

        # names of all nodes
        self.machineNames = machineNames

        # Possible severities, categories, error codes, and error locations of log events (error code denoted by index of list)
        self.severities =  ['FATAL', 'WARNING', 'INFO', 'SEVERE', 'FAILURE', 'ERROR']
        self.facilities = ['MMCS', 'APP', 'KERNEL', 'LINKCARD', 'MONITOR', 'HARDWARE', 'DISCOVERY']
        self.errorLocations = machineNames

        # Statistical average time between failures for a node
        baseAverageMinutesBetweenFailures = 5 # For demo purposes
        averageTimeBetweenFailuresDistribution = numpy.random.normal(
            loc=baseAverageMinutesBetweenFailures, # Mean
            scale=1, # Standard deviation
            size=len(machineNames) # The number of entries

        )

        # Holds index of node information, including:
        #   - last failure time for each node (initially 'None' for each node),
        #   - CPU usage (initially 20% for each node)
        #   - memory usage (initially 30% for each node)
        #   - context switch rate (initially 20% for each node)
        #   - predicted crash time
        #   - probability of events of each severity category
        #   - average time between two consecutive errors
        self.nodeInfo = {}
        nodeIndex = 0
        for name in machineNames:
            self.nodeInfo[name] = {
                'cpuUsage': 0.2,
                'memoryUsage': 0.3,
                'contextSwitchRate': 0.1, # What is this???
                'lastFailureTime': None,
                'predictedCrashTime': datetime.now() + averageTimeBetweenFailuresDistribution[nodeIndex],
                'predictedSeverityProbabilities': {
                    'FATAL' : 0.05,
                    'ERROR': 0.1,
                    'WARN': 0.2,
                    'INFO': 0.5
                },
                'averageTimeBetweenErrors': averageTimeBetweenFailuresDistribution[nodeIndex],
                'health': 0.9 # Scale of 0-1

            }
            nodeIndex += 1


    def run(self):
        """
          Runs the simulator thread, at each tick updating all subscribed clients
        """

        while True:

            # Insert some random delay between 0 and 2 second
            sleep(2 * random())

            # Create a random log event
            logEvent = self.generateRandomLogEvent()

            # update the logMessages structure
            self.serverLock.acquire()

            for clientId in self.logMessages:

                # Add the new log event to the client's queue
                self.logMessages[clientId]['updates'].put(logEvent)

                # Notify client that a message has arrived
                self.logMessages[clientId]['trigger'].release()

            self.serverLock.release()


    def generateRandomLogEvent(self):
        """
          Creates some random event in the proper dictionary format for log events, and returns it.
        """

        # Get a random node, severity, and facility
        machineName = self.getRandomElement(self.machineNames)
        randomSeverity = self.getRandomElement(self.severities)
        randomFacility = self.getRandomElement(self.facilities)

        logEvent = {
            'message': os.urandom(int(random() * 50)), # Generate a random string
            'severity': randomSeverity,
            'facility': randomFacility,
            'location': machineName,
        }


        return logEvent


    def getRandomElement(self, array):
        """
            Returns a random element from an array
        """

        index = int(random() * len(array))
        if index == len(array):
            index -= 1
        return array[index]
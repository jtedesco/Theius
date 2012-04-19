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
        averageMinutesBetweenFailures = numpy.random.normal(
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
                'predictedFailureTime': datetime.now() + averageMinutesBetweenFailures[nodeIndex],
                'predictedSeverityProbabilities': {
                    'FATAL' : 0.05,
                    'ERROR': 0.1,
                    'WARN': 0.2,
                    'INFO': 0.5
                },
                'averageMinutesBetweenFailures': averageMinutesBetweenFailures[nodeIndex],
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

            # Create some random log events (between 1 and 5)
            numberOfLogEvents = int(4 * random) + 1
            logEvents = []
            for i in xrange(0,numberOfLogEvents):
                logEvents.append(self.generateRandomLogEvent())

            # Gather updated node info based on each log event
            nodeInfoUpdates = self.getUpdatedNodeInfoBasedOnEvents(logEvents)

            # update the logMessages structure
            self.serverLock.acquire()

            for clientId in self.logMessages:

                # Add the new log event to the client's queue
                for logEvent in logEvents:
                    self.logMessages[clientId]['updates'].put(logEvent)

                # Add the node info deltas
                self.logMessages[clientId]['nodeInfo'] = nodeInfoUpdates

                # Notify client that a message has arrived
                self.logMessages[clientId]['trigger'].release()

            self.serverLock.release()

            # Apply the node info updates to the simulator's state



    def getUpdatedNodeInfoBasedOnEvents(self, logEvents):
        """
          Creates some updated node data (for random parts of the cluster), based on the given log events.
        """

        # Create distributions for randomly increasing/decreasing predicted severity probabilities
        predictedFatalDelta =  numpy.random.normal(loc=0, scale=0.02, size=1000)
        predictedErrorDelta =  numpy.random.normal(loc=0, scale=0.05, size=1000)
        predictedWarnDelta =  predictedErrorDelta
        predictedInfoDelta =  predictedErrorDelta

        # Create distributions for randomly increasing/decreasing CPU/memory/context switch stats
        cpuUsageDelta =  numpy.random.normal(loc=0, scale=0.1, size=1000)
        memoryUsageDelta =  numpy.random.normal(loc=0, scale=0.05, size=1000)
        contextSwitchRateDelta =  memoryUsageDelta

        updatedNodeInfo = {}

        # Definitely update everything (except performance/usage) for nodes associated with log events
        for logEvent in logEvents:

            # Add an entry if there isn't one already
            if logEvent['location'] not in updatedNodeInfo:
                updatedNodeInfo[logEvent['location']] = {}
            nodeInfo = updatedNodeInfo[logEvent['location']]

            # Update failure data if this log event was FATAL
            if logEvent['severity'] is 'FATAL':

                lastFailureTime = nodeInfo['lastFailureTime']

                # Update average minutes between failures & last failure info
                if lastFailureTime is not None:
                    delta = logEvent['timestamp'] - lastFailureTime
                    nodeInfo['averageMinutesBetweenFailures'] = (self.nodeInfo[logEvent['location']]['averageMinutesBetweenFailures'] + (delta.seconds//3600))/2
                nodeInfo['lastFailureTime'] = logEvent['timestamp']
                nodeInfo['predictedFailureTime'] = logEvent['timestamp'] + nodeInfo['averageMinutesBetweenFailures']

            # Update predicted crash time if
            elif nodeInfo['predictedFailureTime'] < logEvent['timestamp']:
                nodeInfo['predictedFailureTime'] = logEvent['timestamp'] + nodeInfo['averageMinutesBetweenFailures']

            # Update the health of this node
            healthDelta = {
                'FATAL' : -0.2,
                'ERROR': -0.5,
                'WARN': 0.0,
                'INFO': 0.1
            }
            nodeInfo['health'] = self.normalizeValue(self.nodeInfo[logEvent['location']]['health'] + healthDelta[logEvent['severity']])

            # Update this node's predicted severity probabilities
            nodeInfo['predictedSeverityProbabilities'] = {
                'FATAL' : self.normalizeValue(nodeInfo['predictedSeverityProbabilities']['FATAL'] + self.getRandomElement(predictedFatalDelta)),
                'ERROR': self.normalizeValue(nodeInfo['predictedSeverityProbabilities']['ERROR'] + self.getRandomElement(predictedErrorDelta)),
                'WARN': self.normalizeValue(nodeInfo['predictedSeverityProbabilities']['WARN'] + self.getRandomElement(predictedWarnDelta)),
                'INFO': self.normalizeValue(nodeInfo['predictedSeverityProbabilities']['INFO'] + self.getRandomElement(predictedInfoDelta))
            }

            # Update this node's cpu/memory/context-switch stats
            nodeInfo['predictedSeverityProbabilities'] = {
                'cpuUsage' : self.normalizeValue(nodeInfo['cpuUsage'] + self.getRandomElement(cpuUsageDelta)),
                'memoryUsage': self.normalizeValue(nodeInfo['memoryUsage'] + self.getRandomElement(memoryUsageDelta)),
                'contextSwitchRate': self.normalizeValue(nodeInfo['contextSwitchRate'] + self.getRandomElement(contextSwitchRateDelta))
            }

        return updatedNodeInfo


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
            'timestamp': datetime.now()
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


    def normalizeValue(self, value):
        """
          Returns the value if it is between 0 and 1, otherwise, limits it within [0,1]
        """

        if value < 0:
            return 0
        if value > 1:
            return 1
        return value

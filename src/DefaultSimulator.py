from datetime import datetime, timedelta
from random import random, choice
import string
import threading
from time import sleep
import numpy
from BaseSimulator import BaseSimulator

TIMESTAMP_FORMAT = '%d/%m/%y %H:%M'


__author__ = 'jon'


class DefaultSimulator(BaseSimulator):
    def __init__(self, machineNames, structure):
        """
          Initialize the simulator
        """

        BaseSimulator.__init__(self)

        # names of all nodes
        self.machineNames = machineNames
        self.structure = structure

        # Possible severities, categories, error codes, and error locations of log events (error code denoted by index of list)
        self.severities =  ['FATAL', 'WARN', 'INFO', 'ERROR']
        self.facilities = ['MMCS', 'APP', 'KERNEL', 'LINKCARD', 'MONITOR', 'HARDWARE', 'DISCOVERY']
        self.errorLocations = machineNames

        # Statistical average time between failures for a node
        baseAverageMinutesBetweenFailures = 60 # For demo purposes
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
                'name': name,
                'cpuUsage': 0.2,
                'memoryUsage': 0.3,
                'contextSwitchRate': 0.1, # What is this???
                'lastFailureTime': None,
                'predictedFailureTime': datetime.strftime(datetime.now() + timedelta(minutes=averageMinutesBetweenFailures[nodeIndex]), TIMESTAMP_FORMAT),
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

    def currentState(self):
        """
            returns the current state of the cluster
        """
        return self.nodeInfo

    def getStructure(self):
        """
            Returns the current structure of the cluster
        """
        return self.structure

    def run(self):
        """
          Runs the simulator thread, at each tick updating all subscribed clients
        """

        while True:

            # Insert some random delay between 0 and 2 second
            sleep(2 * random())

            # Create some random log events (between 1 and 5)
            numberOfLogEvents = int(4 * random()) + 1
            logEvents = []
            for i in xrange(0,numberOfLogEvents):
                logEvents.append(self.generateRandomLogEvent())

            # Gather updated node info based on each log event
            nodeInfoUpdates = self.getUpdatedNodeInfoBasedOnEvents(logEvents)

            # Add log to simulator
            log = {
                'events' : logEvents,
                'stateChange' : nodeInfoUpdates
            }
            self.addLog(log)

            # Apply the node info updates to the simulator's state
            self.applyNodeInfoUpdates(nodeInfoUpdates)


    def applyNodeInfoUpdates(self, updates):
        """
          Apply the node info updates to the simulator thread's state
        """

        for nodeName in updates:
            nodeDataToUpdate = updates[nodeName]
            for entryName in nodeDataToUpdate:
                self.nodeInfo[nodeName][entryName] = nodeDataToUpdate[entryName]


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
            nodeName = logEvent['location']
            if nodeName not in updatedNodeInfo:
                updatedNodeInfo[nodeName] = {}
            nodeInfo = updatedNodeInfo[nodeName]

            # Update failure data if this log event was FATAL
            if logEvent['severity'] is 'FATAL':

                if self.nodeInfo[nodeName]['lastFailureTime'] is not None:
                    lastFailureTime = datetime.strptime(self.nodeInfo[nodeName]['lastFailureTime'], TIMESTAMP_FORMAT)

                    # Update average minutes between failures & last failure info
                    delta = datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT) - lastFailureTime
                    nodeInfo['averageMinutesBetweenFailures'] = (self.nodeInfo[nodeName]['averageMinutesBetweenFailures'] + (delta.seconds//3600))/2

                nodeInfo['lastFailureTime'] = logEvent['timestamp']
                nodeInfo['predictedFailureTime'] = datetime.strftime(datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT) + timedelta(minutes=self.nodeInfo[nodeName]['averageMinutesBetweenFailures']), TIMESTAMP_FORMAT)

            # Update predicted crash time if
            elif datetime.strptime(self.nodeInfo[nodeName]['predictedFailureTime'], TIMESTAMP_FORMAT) < datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT):
                nodeInfo['predictedFailureTime'] = datetime.strftime(datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT) + timedelta(minutes=self.nodeInfo[nodeName]['averageMinutesBetweenFailures']), TIMESTAMP_FORMAT)

            # Update the health of this node
            healthDelta = {
                'FATAL' : -0.2,
                'ERROR': 0.05,
                'WARN': 0.1,
                'INFO': 0.15
            }
            nodeInfo['health'] = self.normalizeValue(self.nodeInfo[nodeName]['health'] + healthDelta[logEvent['severity']])

            # Update this node's predicted severity probabilities
            nodeInfo['predictedSeverityProbabilities'] = {
                'FATAL' : self.normalizeValue(self.nodeInfo[nodeName]['predictedSeverityProbabilities']['FATAL'] + self.getRandomElement(predictedFatalDelta)),
                'ERROR': self.normalizeValue(self.nodeInfo[nodeName]['predictedSeverityProbabilities']['ERROR'] + self.getRandomElement(predictedErrorDelta)),
                'WARN': self.normalizeValue(self.nodeInfo[nodeName]['predictedSeverityProbabilities']['WARN'] + self.getRandomElement(predictedWarnDelta)),
                'INFO': self.normalizeValue(self.nodeInfo[nodeName]['predictedSeverityProbabilities']['INFO'] + self.getRandomElement(predictedInfoDelta))
            }

            # Update this node's cpu/memory/context-switch stats
            nodeInfo['cpuUsage'] = self.normalizeValue(self.nodeInfo[nodeName]['cpuUsage'] + self.getRandomElement(cpuUsageDelta))
            nodeInfo['memoryUsage'] = self.normalizeValue(self.nodeInfo[nodeName]['memoryUsage'] + self.getRandomElement(memoryUsageDelta))
            nodeInfo['contextSwitchRate'] = self.normalizeValue(self.nodeInfo[nodeName]['contextSwitchRate'] + self.getRandomElement(contextSwitchRateDelta))


        # Randomly update between 0 and 1/2 of the usage statistics of the nodes
        numberOfMachinesToUpdate = int(random() * len(self.machineNames) / 2.0) + 1
        for nodeNum in xrange(0, numberOfMachinesToUpdate):
            nodeName = self.getRandomElement(self.machineNames)

            if nodeName in updatedNodeInfo:
                nodeInfo = updatedNodeInfo[nodeName]
            else:
                updatedNodeInfo[nodeName] = {}
                nodeInfo = updatedNodeInfo[nodeName]

            # Update this node's cpu/memory/context-switch stats
            nodeInfo['cpuUsage'] = self.normalizeValue(self.nodeInfo[nodeName]['cpuUsage'] + self.getRandomElement(cpuUsageDelta))
            nodeInfo['memoryUsage'] = self.normalizeValue(self.nodeInfo[nodeName]['memoryUsage'] + self.getRandomElement(memoryUsageDelta))
            nodeInfo['contextSwitchRate'] = self.normalizeValue(self.nodeInfo[nodeName]['contextSwitchRate'] + self.getRandomElement(contextSwitchRateDelta))

        return updatedNodeInfo


    def generateRandomLogEvent(self):
        """
          Creates some random event in the proper dictionary format for log events, and returns it.
        """

        # Get a random node, severity, and facility
        machineName = self.getRandomElement(self.machineNames)
        randomSeverity = self.getRandomElement(self.severities)
        randomFacility = self.getRandomElement(self.facilities)

        # Generate a random ascii string
        randomLength = int(random() * 50)
        randomString = ''.join(choice(string.ascii_letters) for x in range(randomLength))

        logEvent = {
            'message': randomString,
            'severity': randomSeverity,
            'facility': randomFacility,
            'location': machineName,
            'timestamp': datetime.strftime(datetime.now(), TIMESTAMP_FORMAT)
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

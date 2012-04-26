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

        # Statistical average time between failures for a node
        baseAverageMinutesBetweenFailures = 60 # For demo purposes
        averageMinutesBetweenFailures = numpy.random.normal(
            loc=baseAverageMinutesBetweenFailures, # Mean
            scale=1, # Standard deviation
            size=len(machineNames) # The number of entries

        )

        # Create distributions for randomly increasing/decreasing predicted severity probabilities
        self.deltaMap = {}
        self.deltaMap['predictedFatal'] = numpy.random.normal(loc=0, scale=0.02, size=1000)
        self.deltaMap['predictedError'] =  numpy.random.normal(loc=0, scale=0.05, size=1000)
        self.deltaMap['predictedWarn']  =  self.deltaMap['predictedError']
        self.deltaMap['predictedInfo']  =  self.deltaMap['predictedError']

        # Create distributions for randomly increasing/decreasing CPU/memory/context switch stats
        self.deltaMap['cpuUsage'] =  numpy.random.normal(loc=0, scale=0.1, size=1000)
        self.deltaMap['memoryUsage'] =  numpy.random.normal(loc=0, scale=0.05, size=1000)
        self.deltaMap['contextSwitchRate'] =  self.deltaMap['memoryUsage']

        self.deltaMap['health'] = {
            'FATAL' : -0.2,
            'ERROR': 0.05,
            'WARN': 0.1,
            'INFO': 0.15
        }

        # Holds index of node information, including:
        #   - last failure time for each node (initially 'None' for each node),
        #   - CPU usage (initially 20% for each node)
        #   - memory usage (initially 30% for each node)
        #   - context switch rate (initially 20% for each node)
        #   - predicted crash time
        #   - probability of events of each severity category
        #   - average time between two consecutive errors
        self.nodeState = {}
        nodeIndex = 0
        for name in machineNames:
            self.nodeState[name] = {
                'name': name,
                'cpuUsage': 0.2,
                'memoryUsage': 0.3,
                'contextSwitchRate': 0.1, # What is this???
                'events': [],
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


    def state(self):
        """
            returns the current state of the cluster
        """
        return self.nodeState

    def topology(self):
        """
            Returns the current structure of the cluster
        """
        return self.structure

    def delay(self):
        """
            How long to wait in between ticks
        """
        sleep(2 * random())

    def numberOfLogEventsPerTick(self):
        """
            Between 1 and 5 log events per tick
        """
        return int(4 * random()) + 1

    def randomizeProperty(self, nodeName, propertyName, associatedData=None):
        """
            Randomizes a property for a given node, returning its new value
        """

        if propertyName is 'predictedSeverityProbabilities':
            return {
                'FATAL' : self.normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['FATAL'] + self.getRandomElement(self.deltaMap['predictedFatal'])),
                'ERROR': self.normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['ERROR'] + self.getRandomElement(self.deltaMap['predictedError'])),
                'WARN': self.normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['WARN'] + self.getRandomElement(self.deltaMap['predictedWarn'])),
                'INFO': self.normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['INFO'] + self.getRandomElement(self.deltaMap['predictedInfo']))
            }
        elif propertyName is 'health':
            return self.normalizeValue(self.nodeState[nodeName]['health'] + self.deltaMap['health'][associatedData['severity']])
        else:
            return self.normalizeValue(self.nodeState[nodeName][propertyName] + self.getRandomElement(self.deltaMap[propertyName]))

    def run(self):
        """
          Runs the simulator thread, at each tick updating all subscribed clients
        """

        while True:

            # Insert some random delay between 0 and 2 second
            self.delay()

            # Create some random log events (between 1 and 5)
            numberOfLogEvents = self.numberOfLogEventsPerTick()
            logEvents = []
            for i in xrange(0,numberOfLogEvents):
                logEvents.append(self.generateRandomLogEvent())

            # Gather updated node info based on each log event
            nodeStateChange = self.getStateChange(logEvents)

            log = {
                'events' : logEvents,
                'stateChange' : nodeStateChange
            }

            # Add to the global list of logs
            self.addLog(log)

            # Apply the node info updates to the simulator's state
            self.applyChanges(nodeStateChange)

    def applyChanges(self, updates):
        """
          Apply the node info updates to the simulator thread's state
        """

        for nodeName in updates:
            nodeDataToUpdate = updates[nodeName]
            for entryName in nodeDataToUpdate:
                if entryName is 'events':
                    self.nodeState[nodeName][entryName].extend(nodeDataToUpdate[entryName])
                else:
                    self.nodeState[nodeName][entryName] = nodeDataToUpdate[entryName]


    def getStateChange(self, logEvents):
        """
          Creates some updated node data (for random parts of the cluster), based on the given log events.
        """

        stateChange = {}
        for name in self.machineNames:
            stateChange[name] = {}

        self.getStateChangeFromLogs(logEvents, stateChange)
        self.addRandomStateChanges(stateChange)

        return stateChange

    def addRandomStateChanges(self, stateChange):
        """
            randomly changes the state of various properties
        """

        # Randomly update between 0 and 1/2 of the usage statistics of the nodes
        numberOfMachinesToUpdate = int(random() * len(self.machineNames) / 2.0) + 1
        for nodeNum in xrange(0, numberOfMachinesToUpdate):
            nodeName = self.getRandomElement(self.machineNames)
            nodeInfo = stateChange[nodeName]

            # Update this node's cpu/memory/context-switch stats
            nodeInfo['cpuUsage'] = self.randomizeProperty(nodeName, 'cpuUsage')
            nodeInfo['memoryUsage'] = self.randomizeProperty(nodeName, 'memoryUsage')
            nodeInfo['contextSwitchRate'] = self.randomizeProperty(nodeName, 'contextSwitchRate')


    def getStateChangeFromLogs(self, logEvents, stateChange):
        """
            returns the change in state of nodes based on the given log events
        """

        # Definitely update everything (except performance/usage) for nodes associated with log events
        for logEvent in logEvents:

            # Add an entry if there isn't one already
            nodeName = logEvent['location']
            if 'events' not in stateChange[nodeName]:
                stateChange[nodeName] = {
                    'events': []
                }
            stateChange[nodeName]['events'].append(logEvent)
            nodeInfo = stateChange[nodeName]

            self.updateFailurePredictionMetrics(nodeName, nodeInfo, logEvent)

            # Update other properties of this node
            nodeInfo['health'] = self.randomizeProperty(nodeName, 'health', logEvent)
            nodeInfo['predictedSeverityProbabilities'] = self.randomizeProperty(nodeName, 'predictedSeverityProbabilities', logEvent)
            nodeInfo['cpuUsage'] = self.randomizeProperty(nodeName, 'cpuUsage', logEvent)
            nodeInfo['memoryUsage'] = self.randomizeProperty(nodeName, 'memoryUsage', logEvent)
            nodeInfo['contextSwitchRate'] = self.randomizeProperty(nodeName, 'contextSwitchRate', logEvent)

        return stateChange

    def updateFailurePredictionMetrics(self, nodeName, nodeInfo, logEvent):
        """
            updates averageMinutesBetweenFailures, lastFailureTime and predictedFailureTime for this node
        """

        # Update failure data if this log event was FATAL
        if logEvent['severity'] is 'FATAL':

            if self.nodeState[nodeName]['lastFailureTime'] is not None:
                lastFailureTime = datetime.strptime(self.nodeState[nodeName]['lastFailureTime'], TIMESTAMP_FORMAT)

                # Update average minutes between failures & last failure info
                delta = datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT) - lastFailureTime
                nodeInfo['averageMinutesBetweenFailures'] = (self.nodeState[nodeName]['averageMinutesBetweenFailures'] + (delta.seconds//3600))/2

            nodeInfo['lastFailureTime'] = logEvent['timestamp']
            nodeInfo['predictedFailureTime'] = datetime.strftime(datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT) + timedelta(minutes=self.nodeState[nodeName]['averageMinutesBetweenFailures']), TIMESTAMP_FORMAT)

        # Update predicted crash time if
        elif datetime.strptime(self.nodeState[nodeName]['predictedFailureTime'], TIMESTAMP_FORMAT) < datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT):
            nodeInfo['predictedFailureTime'] = datetime.strftime(datetime.strptime(logEvent['timestamp'], TIMESTAMP_FORMAT) + timedelta(minutes=self.nodeState[nodeName]['averageMinutesBetweenFailures']), TIMESTAMP_FORMAT)

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

from datetime import datetime, timedelta
from random import random, choice
import string
from time import sleep
import numpy
from src.Utility import normalizeValue, getRandomElement

__author__ = 'jon'

class RandomSimulator:
    def __init__(self, machineNames):
        """
          Initialize the simulator
        """

        # names of all nodes
        self.machineNames = machineNames

        # Possible severities, categories, error codes, and error locations of log events (error code denoted by index of list)
        self.severities =  ['FATAL', 'WARN', 'INFO', 'ERROR']
        self.facilities = ['MMCS', 'APP', 'KERNEL', 'LINKCARD', 'MONITOR', 'HARDWARE', 'DISCOVERY']

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

        self.TIMESTAMP_FORMAT = '%d/%m/%y %H:%M'

        self.nodeState = {}
        for name in self.machineNames:
            self.addMachine(name)


    def addMachine(self, name):
        # Holds index of node information, including:
        #   - last failure time for each node (initially 'None' for each node),
        #   - CPU usage (initially 20% for each node)
        #   - memory usage (initially 30% for each node)
        #   - context switch rate (initially 20% for each node)
        #   - predicted crash time
        #   - probability of events of each severity category
        #   - average time between two consecutive errors
        if name not in self.machineNames:
            self.machineNames.append(name)
        self.nodeState[name] = {
            'name': name,
            'cpuUsage': 0.2,
            'memoryUsage': 0.3,
            'contextSwitchRate': 0.1, # What is this???
            'events': [],
            'lastFailureTime': None,
            'predictedFailureTime': datetime.strftime(datetime.now() + timedelta(minutes=self.averageMinutesBetweenFailures()), self.TIMESTAMP_FORMAT),
            'predictedSeverityProbabilities': {
                'FATAL' : 0.05,
                'ERROR': 0.1,
                'WARN': 0.2,
                'INFO': 0.5
            },
            'averageMinutesBetweenFailures': self.averageMinutesBetweenFailures(),
            'health': 0.9 # Scale of 0-1
        }

    def removeMachine(self, name):
        del self.nodeState[name]
        self.machineNames.remove(name)

    def averageMinutesBetweenFailures(self):
        # Statistical average time between failures for a node
        baseAverageMinutesBetweenFailures = 60 # For demo purposes
        return numpy.random.normal(
            loc=baseAverageMinutesBetweenFailures, # Mean
            scale=1, # Standard deviation
        )

    def state(self):
        """
            returns the current state of the cluster
        """
        return self.nodeState

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

        if propertyName == 'predictedSeverityProbabilities':
            return {
                'FATAL' : normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['FATAL'] + getRandomElement(self.deltaMap['predictedFatal'])),
                'ERROR': normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['ERROR'] + getRandomElement(self.deltaMap['predictedError'])),
                'WARN': normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['WARN'] + getRandomElement(self.deltaMap['predictedWarn'])),
                'INFO': normalizeValue(self.nodeState[nodeName]['predictedSeverityProbabilities']['INFO'] + getRandomElement(self.deltaMap['predictedInfo']))
            }
        elif propertyName == 'health':
            return normalizeValue(self.nodeState[nodeName]['health'] + self.deltaMap['health'][associatedData['severity']])
        else:
            return normalizeValue(self.nodeState[nodeName][propertyName] + getRandomElement(self.deltaMap[propertyName]))

    def updates(self):
        """
          Gets the next updates for the next tick
        """
        if len(self.machineNames) <= 0:
            return {
                'events': [],
                'stateChange': []
            }

        # Create some random log events (between 1 and 5)
        numberOfLogEvents = self.numberOfLogEventsPerTick()
        logEvents = []
        for i in xrange(0, numberOfLogEvents):
            logEvents.append(self.generateRandomLogEvent())

        # Gather updated node info based on each log event
        nodeStateChange = self.getStateChange(logEvents)

        # Apply the node info updates to the simulator's state
        self.applyChanges(nodeStateChange)

        log = {
            'events': logEvents,
            'stateChange': nodeStateChange
        }

        return log

    def applyChanges(self, updates):
        """
          Apply the node info updates to the simulator thread's state
        """

        for nodeName in updates:
            nodeDataToUpdate = updates[nodeName]
            for entryName in nodeDataToUpdate:
                if entryName == 'events':
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
        # numberOfMachinesToUpdate = int(random() * len(self.machineNames) / 2.0) + 1
        numberOfMachinesToUpdate = len(self.machineNames)
        for nodeNum in xrange(0, numberOfMachinesToUpdate):
            nodeName = getRandomElement(self.machineNames)
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
        if logEvent['severity'] == 'FATAL':

            if self.nodeState[nodeName]['lastFailureTime'] is not None:
                lastFailureTime = datetime.strptime(self.nodeState[nodeName]['lastFailureTime'], self.TIMESTAMP_FORMAT)

                # Update average minutes between failures & last failure info
                delta = datetime.strptime(logEvent['timestamp'], self.TIMESTAMP_FORMAT) - lastFailureTime
                nodeInfo['averageMinutesBetweenFailures'] = (self.nodeState[nodeName]['averageMinutesBetweenFailures'] + (delta.seconds//3600))/2

            nodeInfo['lastFailureTime'] = logEvent['timestamp']
            nodeInfo['predictedFailureTime'] = datetime.strftime(datetime.strptime(logEvent['timestamp'], self.TIMESTAMP_FORMAT) + timedelta(minutes=self.nodeState[nodeName]['averageMinutesBetweenFailures']), self.TIMESTAMP_FORMAT)

        # Update predicted crash time if
        elif datetime.strptime(self.nodeState[nodeName]['predictedFailureTime'], self.TIMESTAMP_FORMAT) < datetime.strptime(logEvent['timestamp'], self.TIMESTAMP_FORMAT):
            nodeInfo['predictedFailureTime'] = datetime.strftime(datetime.strptime(logEvent['timestamp'], self.TIMESTAMP_FORMAT) + timedelta(minutes=self.nodeState[nodeName]['averageMinutesBetweenFailures']), self.TIMESTAMP_FORMAT)

    def generateRandomLogEvent(self):
        """
          Creates some random event in the proper dictionary format for log events, and returns it.
        """

        # Get a random node, severity, and facility
        machineName = getRandomElement(self.machineNames)
        randomSeverity = getRandomElement(self.severities)
        randomFacility = getRandomElement(self.facilities)

        # Generate a random ascii string
        randomLength = int(random() * 50)
        randomString = ''.join(choice(string.ascii_letters) for x in range(randomLength))

        logEvent = {
            'message': randomString,
            'severity': randomSeverity,
            'facility': randomFacility,
            'location': machineName,
            'timestamp': datetime.strftime(datetime.now(), self.TIMESTAMP_FORMAT)
        }

        return logEvent

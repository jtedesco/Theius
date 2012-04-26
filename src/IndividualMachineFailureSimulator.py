from copy import deepcopy
from random import random, choice
import string
from datetime import datetime

__author__ = 'Roman'

import numpy
from DefaultSimulator import DefaultSimulator

__author__ = 'Roman'


class IndividualMachineFailureSimulator(DefaultSimulator):
    def __init__(self, machineNames, structure):
        """
            constructor
        """
        DefaultSimulator.__init__(self, machineNames, structure)

        self.badMachines = ["machine1-3", "machine2-6", "machine2-7", "machine3-1"]

        self.badNodeHealthDelta = { }
        for name in self.deltaMap['health']:
            self.badNodeHealthDelta[name] = self.deltaMap['health'][name] - .10

        self.badNodeCpuDelta = numpy.random.normal(loc=0.05, scale=0.1, size=1000)

        self.weightedMachineNamesList = deepcopy(self.machineNames)
        for name in self.badMachines:
            for i in xrange(0,5):
                self.weightedMachineNamesList.append(name)

        self.weightedSeverities = deepcopy(self.severities)
        self.weightedSeverities.append("FATAL")
        self.weightedSeverities.append("ERROR")
        self.weightedSeverities.append("ERROR")



    def randomizeProperty(self, nodeName, propertyName, associatedData=None):
        """
            Randomizes a property for a given node, returning its new value
        """

        # the following machines will have poor health
        if nodeName in self.badMachines:
            if propertyName == "health":
                return self.normalizeValue(self.nodeState[nodeName][propertyName] + self.badNodeHealthDelta[associatedData['severity']])
            elif propertyName == "cpuUsage":
                return self.normalizeValue(self.nodeState[nodeName][propertyName] + self.getRandomElement(self.badNodeCpuDelta))

        return super(IndividualMachineFailureSimulator, self).randomizeProperty(nodeName, propertyName, associatedData)

    def generateRandomLogEvent(self):
        """
          Creates some random event in the proper dictionary format for log events, and returns it.
        """

        # Get a random node, severity, and facility
        machineName = self.getRandomElement(self.weightedMachineNamesList)

        if machineName in self.badMachines:
            randomSeverity = self.getRandomElement(self.weightedSeverities)
        else:
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
            'timestamp': datetime.strftime(datetime.now(), self.TIMESTAMP_FORMAT)
        }

        return logEvent
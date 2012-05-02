from copy import deepcopy
from random import random, choice
import string
from datetime import datetime
from src.Utility import normalizeValue, getRandomElement
from src.simulator.RandomSimulator import RandomSimulator

__author__ = 'Roman'

import numpy

__author__ = 'Roman'


class IndividualMachineFailureSimulator(RandomSimulator):
    def __init__(self, machineNames):
        """
            constructor
        """
        RandomSimulator.__init__(self, machineNames)

        self.badMachines = ["machine1-3", "machine2-6", "machine2-7", "machine3-1"]

        self.badNodeHealthDelta = { }
        for name in self.deltaMap['health']:
            self.badNodeHealthDelta[name] = self.deltaMap['health'][name]

        self.badNodeMemoryDelta = numpy.random.normal(loc=0.02, scale=0.05, size=1000)

        self.weightedMachineNamesList = deepcopy(self.machineNames)
        for name in self.badMachines:
            for i in xrange(0,3):
                self.weightedMachineNamesList.append(name)

        self.weightedSeverities = deepcopy(self.severities)
        for i in xrange(0,4):
            self.weightedSeverities.append("FATAL")
        for i in xrange(0,3):
            self.weightedSeverities.append("ERROR")

        self.weightedFacilities = deepcopy(self.facilities)
        for i in xrange(0,4):
            self.weightedFacilities.append("KERNEL")



    def randomizeProperty(self, nodeName, propertyName, associatedData=None):
        """
            Randomizes a property for a given node, returning its new value
        """

        # the following machines will have poor health
        if nodeName in self.badMachines:
            if propertyName == "health":
                return normalizeValue(self.nodeState[nodeName][propertyName] + self.badNodeHealthDelta[associatedData['severity']])
            elif propertyName == "memoryUsage":
                return normalizeValue(self.nodeState[nodeName][propertyName] + getRandomElement(self.badNodeMemoryDelta))

        if propertyName == "memoryUsage":
            return normalizeValue(self.nodeState[nodeName][propertyName] + numpy.random.normal(loc=-0.025, scale=0.05))

        return RandomSimulator.randomizeProperty(self, nodeName, propertyName, associatedData)

    def generateRandomLogEvent(self):
        """
          Creates some random event in the proper dictionary format for log events, and returns it.
        """

        # Get a random node, severity, and facility
        machineName = getRandomElement(self.weightedMachineNamesList)

        if machineName in self.badMachines:
            randomSeverity = getRandomElement(self.weightedSeverities)
            randomFacility = getRandomElement(self.weightedFacilities)
        else:
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
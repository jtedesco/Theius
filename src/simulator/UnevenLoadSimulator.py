import numpy
from src.Utility import getRandomElement, normalizeValue
from src.simulator.DefaultSimulator import DefaultSimulator

__author__ = 'Roman'


class UnevenLoadSimulator(DefaultSimulator):
    def __init__(self, machineNames, structure):
        """
            constructor
        """
        self.lowCpuUsageDelta = numpy.random.normal(loc=-0.025, scale=0.1, size=1000)
        self.highCpuUsageDelta = numpy.random.normal(loc=0.025, scale=0.1, size=1000)

        DefaultSimulator.__init__(self, machineNames, structure)

    def randomizeProperty(self, nodeName, propertyName, associatedData=None):
        """
            Randomizes a property for a given node, returning its new value
        """

        # rack1 will have low CPU & memory utilization
        if propertyName == "cpuUsage" or propertyName == "memoryUsage" and "machine1" in nodeName:
            return normalizeValue(self.nodeState[nodeName][propertyName] + getRandomElement(self.lowCpuUsageDelta))

        # rack3 will have high CPU utilization
        elif propertyName == "cpuUsage" or propertyName == "memoryUsage" and "machine3" in nodeName:
            return normalizeValue(self.nodeState[nodeName][propertyName] + getRandomElement(self.highCpuUsageDelta))

        else:
            return super(UnevenLoadSimulator, self).randomizeProperty(nodeName, propertyName, associatedData)
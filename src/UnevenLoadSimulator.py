import numpy
from DefaultSimulator import DefaultSimulator

__author__ = 'Roman'


class UnevenLoadSimulator(DefaultSimulator):
    def __init__(self, machineNames, structure):
        """
            constructor
        """
        self.lowCpuUsageDelta = numpy.random.normal(loc=-0.1, scale=0.1, size=1000)
        self.highCpuUsageDelta = numpy.random.normal(loc=0.1, scale=0.1, size=1000)

        DefaultSimulator.__init__(self, machineNames, structure)

    def randomizeProperty(self, nodeName, propertyName, associatedData=None):
        """
            Randomizes a property for a given node, returning its new value
        """

        # rack1 will have low CPU utilization
        if propertyName == "cpuUsage" and "machine1" in nodeName:
            return self.normalizeValue(self.nodeState[nodeName][propertyName] + self.getRandomElement(self.lowCpuUsageDelta))

        # rack3 will have high CPU utilization
        elif propertyName == "cpuUsage" and "machine3" in nodeName:
            return self.normalizeValue(self.nodeState[nodeName][propertyName] + self.getRandomElement(self.highCpuUsageDelta))

        else:
            return super(UnevenLoadSimulator, self).randomizeProperty(nodeName, propertyName, associatedData);
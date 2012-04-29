from random import random
from src.simulator.mapReduce.MapReduceTaskSimulator import MapReduceTaskSimulator

__author__ = 'Roman'

class MapReduceSimulator:
    def __init__(self, machineNames):
        self.machineNames = machineNames
        self.mapReduceTasks = {}
        self.tasksCreated = 0

    def updates(self):
        if random() < .05:
            self.startNewMapReduceTask()

        updates = {}
        toRemove = []
        for taskName in self.mapReduceTasks:
            taskSimulator = self.mapReduceTasks[taskName]
            updates[taskName] = taskSimulator.updates()
            if taskSimulator.isCompleted():
                toRemove.append(taskName)
                updates[taskName]['complete'] = True

        for taskName in toRemove:
            del self.mapReduceTasks[taskName]

        return updates

    def startNewMapReduceTask(self):
        taskName = "%s%d" % ("task", self.tasksCreated)
        self.tasksCreated += 1

        self.mapReduceTasks[taskName] = MapReduceTaskSimulator(self.machineNames, taskName)
        print "started new map task: ", taskName
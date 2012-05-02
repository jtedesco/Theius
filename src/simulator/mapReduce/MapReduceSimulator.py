from random import random
from src.simulator.mapReduce.MapReduceTaskSimulator import MapReduceTaskSimulator

__author__ = 'Roman'

class MapReduceSimulator:
    def __init__(self, machineNames):
        self.machineNames = machineNames
        self.mapReduceTasks = {}
        self.tasksCreated = 0
        self.time = 0

    def updates(self):
        self.time += 1

        if random() < .025:
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

        return {
            'state': self.state(),
            'topology': self.topology()
        }

    def startNewMapReduceTask(self):
        taskName = "%s%d" % ("task", self.tasksCreated)
        self.tasksCreated += 1

        self.mapReduceTasks[taskName] = MapReduceTaskSimulator(self.machineNames, taskName, self.time)
        print "started new map task: ", taskName

    def topology(self):
        currentTopology = {
            'name': "master",
            'children': []
        }
        for taskName in self.mapReduceTasks:
            taskSimulator = self.mapReduceTasks[taskName]
            currentTopology['children'].append(taskSimulator.topology())

        return currentTopology

    def state(self):
        currentState = {}
        for taskName in self.mapReduceTasks:
            taskSimulator = self.mapReduceTasks[taskName]
            currentState = dict(taskSimulator.state().items() + currentState.items())

        return currentState

    def getTime(self):
        return self.time
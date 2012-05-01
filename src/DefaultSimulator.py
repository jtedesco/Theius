from json import load
import os
from random import random
from time import sleep
from src.BaseSimulator import BaseSimulator
from src.MapReduceSimulator import MapReduceSimulator
from src.RandomSimulator import RandomSimulator

__author__ = 'Roman'

class DefaultSimulator(BaseSimulator):
    def __init__(self, clusterSimulator, clusterTopology, mapReduceSimulator):
        """
          Initialize the simulator
        """

        BaseSimulator.__init__(self)

        self.clusterSimulator = clusterSimulator
        self.clusterTopology = clusterTopology
        self.mapReduceSimulator = mapReduceSimulator

    def tick(self):
        """
            How long to wait in between ticks
        """
        sleep(2 * random())

    def run(self):
        """
          Runs the simulator thread, at each tick updating all subscribed clients
        """

        while True:

            # Insert some random delay between 0 and 2 second
            self.tick()

            clusterUpdates = self.clusterSimulator.updates()
            mapReduceUpdates = self.mapReduceSimulator.updates()

            log = {
                'cluster': clusterUpdates,
                'mapReduce': mapReduceUpdates
            }

            # Add to the global list of logs
            self.addLog(log)

    def getClusterSimulator(self):
        return self.clusterSimulator

    def getMapReduceSimulator(self):
        return self.mapReduceSimulator

    def topology(self):
        return {
            'cluster': self.clusterTopology,
            'mapReduce': self.mapReduceSimulator.topology()
        }

    def state(self):
        return {
            'cluster': self.clusterSimulator.state(),
            'mapReduce': self.mapReduceSimulator.state()
        };

    def getTime(self):
        return self.mapReduceSimulator.getTime()

def main():
    STATIC_DIR = os.path.join(os.path.abspath('../../'), 'static')
    networkTopology = load(open(os.path.join(STATIC_DIR, 'data/topology.json')))
    randomSimulator = RandomSimulator(networkTopology['machines'])
    clusterSimulator = MapReduceSimulator(networkTopology['machines'])
    mainSimulator = DefaultSimulator(randomSimulator, networkTopology['structure'], clusterSimulator)
    mainSimulator.start()

    mainSimulator.addClient(1)

    while True:
        stuff = mainSimulator.getNextLog(1)
        print mainSimulator.state()['mapReduce']
        print mainSimulator.topology()['mapReduce']

if __name__ == '__main__':
    main()
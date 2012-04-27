from src.simulator.IndividualMachineFailureSimulator import IndividualMachineFailureSimulator

__author__ = 'Roman'

__author__ = 'Roman'


class RackFailureSimulator(IndividualMachineFailureSimulator):
    def __init__(self, machineNames, structure):
        """
            constructor
        """
        IndividualMachineFailureSimulator.__init__(self, machineNames, structure)

        self.badMachines = []
        for name in self.machineNames:
            if "machine1" in name:
                self.badMachines.append(name)
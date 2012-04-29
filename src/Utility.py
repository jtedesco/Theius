from random import random

__author__ = 'Roman'


def getRandomElement(array):
    """
        Returns a random element from an array
    """

    if len(array) == 0:
        return None

    index = int(random() * len(array))
    if index == len(array):
        index -= 1
    return array[index]


def normalizeValue(value):
    """
      Returns the value if it is between 0 and 1, otherwise, limits it within [0,1]
    """

    if value < 0:
        return 0
    if value > 1:
        return 1
    return value

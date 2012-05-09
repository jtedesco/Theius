from copy import deepcopy

__author__ = 'Roman'

id = 0

def makeLargeTopology():
    root = depth([10,10,10,5])
    machines = traverse(root, [])

    return {
        'machines': machines,
        'structure': root
    }

def traverse(node, array):
    array.append(node['name'])

    if '_children' in node:
        for child in node['_children']:
            traverse(child, array)

    return array

def depth(depths):
    if len(depths) == 0:
        return {'name': uniqueName()}

    node = {
        'name': uniqueName(),
        'children': None, # hide all children at start
        '_children': []
    }

    branch = depths.pop()
    for i in xrange(0, branch):
        node['_children'].append(depth(deepcopy(depths)))

    return node

def uniqueName():
    global id
    name = "%s%d" % ("machine", id)
    id += 1
    return name


def main():
    print makeLargeTopology()

if __name__ == '__main__':
    main()
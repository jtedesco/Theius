/**
 * Given some retrieved JSON data of the node structure, displays the information
 * in a graph using the D3 library. The data is to be structured so that the key
 * "name" corresponds to a node's name, and the key "children" is an array of its
 * children.
 * @param data the JSON data described above
 */
function loadGraph(data) {
    // save graph structure so we can redraw later
    window.graphData = data;

    var width = document.documentElement.clientWidth
    var height = document.documentElement.clientHeight / 2;

    var cluster = d3.layout.cluster()
        .size([width, height-100]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    // add main svg element
    d3.select("#graph").selectAll("svg").remove();
    var graph = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(0,40)");

    // get node and link locations from cluster library
    var nodes = cluster.nodes(window.graphData);
    var links = cluster.links(nodes);

    // add links
    var link = graph.selectAll("path.link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    // add nodes (just the container)
    var node = graph.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    window.radiusFunction = function() { return 20;};
    window.colorFunction = function() { return "green";};

    // add circles representing nodes
    node.append("circle")
        .attr("r", window.radiusFunction)
        .attr("fill", window.colorFunction);

    // automatically resize when the window changes
    window.onresize = function(event) {
        redrawGraph();
    };

    return nodes;
}

/**
 * Redraws the graph so that it is up to date with it's associated data
 */
function redrawGraph() {
    // get new width and height
    var width = document.documentElement.clientWidth
    var height = document.documentElement.clientHeight / 2;

    var cluster = d3.layout.cluster()
        .size([width, height-100]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    var nodes = cluster.nodes(window.graphData);
    var links = cluster.links(nodes);

    // update width and height of graph
    var graph = d3.select("#graph").select("svg")
        .attr("width", width)
        .attr("height", height)
        .select("g");

    // update links
    var link = graph.selectAll("path.link")
        .data(links)
        .attr("d", diagonal);

    // update nodes (containers)
    var node = graph.selectAll("g.node")
        .data(nodes)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    // update circles representing nodes
    node.select("circle")
        .transition(2000)
        .attr("r", window.radiusFunction)
        .attr("fill", window.colorFunction);
}

/**
 * Resizes all the circles in the graph to have a radius corresponding to the data passed in.
 * @param data an associative array, where the key is the name of a node, and the value is a node
 * @param key for each node, we take the value using this key as the radius
 */
function circleRadius(data, key) {
    var dataMin = NaN,
        dataMax = NaN;
    var radiusMin = 5,
        radiusMax = 25,
        radiusRange = radiusMax - radiusMin;

    window.radiusFunction = function(d) {
        if (data.hasOwnProperty(d.name) && data[d.name].hasOwnProperty(key)) {
            var value = data[d.name][key];

            if (isNaN(dataMin) || isNaN(dataMax)) {
                dataMin = value;
                dataMax = value;
            }

            dataMin = Math.min(dataMin, value);
            dataMax = Math.max(dataMax, value);

            if (dataMax - dataMin == 0) { //don't want to divide by 0 later!
                return radiusMin;
            }

            // convert from a value between dataMin and dataMax to a value between radiusMin and radiusMax
            var fraction = (value - dataMin) / (dataMax - dataMin);
            return fraction * radiusRange + radiusMin;
        }
        else {
            return radiusMin;
        }
    };

    redrawGraph();
}

/**
 * Colors each circle in the graph based on the data associated with the node
 * @param data an associative array, where the key is the name of a node, and the value is a node
 * @param key for each node, we take the value using this key as the color
 */
function circleColor(data, key) {
    window.colorFunction = function(d) {
        if (data.hasOwnProperty(d.name) && data[d.name].hasOwnProperty(key)) {
            return data[d.name][key];
        }
        else {
            return "green";
        }
    }

   redrawGraph();
}
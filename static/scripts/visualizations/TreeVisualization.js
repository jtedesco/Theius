/**
 * Encapsulates the tree visualization to expose the 'redraw'/
 *
 * Given some retrieved JSON data of the node structure, displays the information
 *  in a graph using the D3 library. The data is to be structured so that the key
 *  "name" corresponds to a node's name, and the key "children" is an array of its
 *  children.
 *
 *  @param  structure     The structure of the cluster
 *  @param  state         The state of the cluster
 */
function TreeVisualization(structure, state) {

    var width = document.documentElement.clientWidth;
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
    var nodes = cluster.nodes(structure);
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

    var radiusFunction = function() { return 20;};
    var colorFunction = function() { return "green";};

    // add circles representing nodes
    node.append("circle")
        .attr("r", radiusFunction)
        .attr("fill", colorFunction);

    // automatically resize when the window changes
    window.onresize = function(event) {
        redrawGraph();
    };

//    window.data = {};
//    for (var i in nodes){
//        if (nodes.hasOwnProperty(i)) {
//            window.data[nodes[i]['name']] = nodes[i];
//            nodes[i]['value'] = 5;
//        }
//    }

    // tie data to circle color and radius
//    circleColor(window.data, 'color');
//    circleRadius(window.data, 'value');

    /**
     * Decide what to do with the log entry that was received here
     * @param logEvent the log entry received from the server
     */
    this.update = function(logEvent) {
        if (window.data.hasOwnProperty(logEvent['location'])) {

            var node = window.data[logEvent['location']];

            for (var elem in logEvent) {
                if (logEvent.hasOwnProperty(elem)) {
                    node[elem] = logEvent[elem]; // copy over data
                }
            }

            redrawGraph();
        }
        else {
            logError("Key \"" + logEvent['location'] + "\" not found");
        }
    };

    /**
     * Redraws the graph so that it is up to date with it's associated data
     */
    var redrawGraph = function() {

        // get new width and height
        var width = document.documentElement.clientWidth;
        var height = document.documentElement.clientHeight / 2;

        var cluster = d3.layout.cluster()
            .size([width, height-100]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y]; });

        var nodes = cluster.nodes(structure);
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
    };

    /**
     * Resizes all the circles in the graph to have a radius corresponding to the data passed in.
     * @param data an associative array, where the key is the name of a node, and the value is a node
     * @param key for each node, we take the value using this key as the radius
     */
    var circleRadius = function(data, key) {
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
    };

    /**
     * Colors each circle in the graph based on the data associated with the node
     * @param data an associative array, where the key is the name of a node, and the value is a node
     * @param key for each node, we take the value using this key as the color
     */
    var circleColor =  function(data, key) {
        window.colorFunction = function(d) {
            if (data.hasOwnProperty(d.name) && data[d.name].hasOwnProperty(key)) {
                return data[d.name][key];
            }
            else {
                return "green";
            }
        };

        redrawGraph();
    };
}
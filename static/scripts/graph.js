/**
 * Given some retrieved JSON data of the node structure, displays the information
 * in a graph using the D3 library. The data is to be structured so that the key
 * "name" corresponds to a node's name, and the key "children" is an array of its
 * children.
 * @param data the JSON data described above
 */
function displayGraph(data) {
    window.graphData = data;
    var width = document.documentElement.clientWidth
    var height = document.documentElement.clientHeight / 2;

    var cluster = d3.layout.cluster()
        .size([width, height-100]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    d3.select("#graph").selectAll("svg").remove();
    var graph = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(0,40)");

    window.nodes = cluster.nodes(window.graphData);
    window.links = cluster.links(window.nodes);

    console.log(window.nodes);

    var link = graph.selectAll("path.link")
        .data(window.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = graph.selectAll("g.node")
        .data(window.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    window.radiusFunction = function() { return 20;};
    window.colorFunction = function() { return "white";};

    node.append("circle")
        .attr("r", window.radiusFunction)
        .attr("fill", window.colorFunction());

    window.onresize = function(event) {
        reloadGraph();
    };
}

function reloadGraph() {
    var width = document.documentElement.clientWidth
    var height = document.documentElement.clientHeight / 2;

    var cluster = d3.layout.cluster()
        .size([width, height-100]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    window.nodes = cluster.nodes(window.graphData);
    window.links = cluster.links(window.nodes);

    var graph = d3.select("#graph").select("svg")
        .attr("width", width)
        .attr("height", height)
        .select("g");

    var link = graph.selectAll("path.link")
        .attr("d", diagonal);

    var node = graph.selectAll("g.node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.select("circle")
        .attr("r", window.radiusFunction)
}

/**
 * Resizes all the circles in the graph to have a radius corresponding to some data
 * passed in. The data should be an associative array whose keys are node names and
 * whose values are integers.
 * @param data the data to represent
 */
function resizeCircles(data) {
    var dataMin = NaN,
        dataMax = NaN;

    for  (var key in data) {
        if (key == "length" || !data.hasOwnProperty(key)) continue;
        var value = data[key];

        if (isNaN(dataMin) || isNaN(dataMax)) {
            dataMin = value;
            dataMax = value;
        }

        dataMin = Math.min(dataMin, value);
        dataMax = Math.max(dataMax, value);
    }
    var radiusMin = 5,
        radiusMax = 25;
    var dataRange = dataMax - dataMin,
        radiusRange = radiusMax - radiusMin;

    var graph = d3.select("#graph");

    window.radiusFunction = function(d) {
        var value = data[d.name];
        var fraction = (value - dataMin) / dataRange;
        return fraction * radiusRange + radiusMin;
    };

    graph.selectAll("g.node")
        .select("circle")
        .transition(2000)
        .attr("r", window.radiusFunction);
}

function changeColors(data) {
    console.log("got here");

    window.colorFunction = function(d) {
        return data[d.name];
    }

    var graph = d3.select("#graph");
    graph.selectAll("g.node")
        .select("circle")
        .transition(2000)
        .attr("fill", window.colorFunction);
}
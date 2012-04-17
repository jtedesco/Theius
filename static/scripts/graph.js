
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

    var nodes = cluster.nodes(data);

    var link = graph.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = graph.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("circle")
        .attr("r", 20)

    window.onresize = function(event) {
        displayGraph(window.graphData);
    };
}

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

    var dataRange = dataMax - dataMin;
    var radiusMin = 5,
        radiusMax = 20,
        radiusRange = radiusMax - radiusMin;

    var graph = d3.select("#graph");

    graph.selectAll("g.node")
        .select("circle")
        .attr("r", function(d) {
            var value = data[d.name];
            var fraction = (value - dataMin) / dataRange;
            return fraction * radiusRange + radiusMin;
        });
}
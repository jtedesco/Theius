
function displayGraph(data) {
    var width = window.screen.availWidth;
    var height = window.screen.availHeight / 2;

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
}
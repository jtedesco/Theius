/**
 * Shows a pie chart of the log data types, based on the logs generate at that node
 */
function PieChartNodeVisualization(nodeState) {

    var This = this;

    // The identifier for the node being visualized
    this.nodeName = nodeState.name;


    /**
     * Gets the identifier for the node being visualization
     */
    this.getNodeName = function() {
        return This.nodeName;
    };


    /**
     * Builds the node visualization
     */
    this.construct = function() {

        var dim = Math.min($('#nodeVisualization').width()-50, $('#nodeVisualization').height()-50);
        var width = dim,
            height = dim,
            outerRadius = Math.min(width, height) / 2,
            innerRadius = outerRadius * .6,
            data = d3.range(10).map(Math.random),
            color = d3.scale.category20(),
            donut = d3.layout.pie(),
            arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        var vis = d3.select("#nodeVisualization")
            .append("svg")
            .data([data])
            .attr("width", width)
            .attr("height", height);

        var arcs = vis.selectAll("g.arc")
            .data(donut)
            .enter().append("g")
            .attr("class", "arc")
            .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

        arcs.append("path")
            .attr("fill", function(d, i) { return color(i); })
            .attr("d", arc);

        arcs.append("text")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("display", function(d) { return d.value > .15 ? null : "none"; })
            .text(function(d, i) { return d.value.toFixed(2); });

        // Actually show the node visualization
        showNodeVisualization();
    };


    /**
     * Updates the active nodeVisualization with the node's new state
     */
    this.update = function(newNodeState) {
        console.log('updating...', newNodeState);
    };


    /**
     * Deconstructs this node visualization (and in general, the active node visualization)
     */
    this.deconstruct = function() {
        $('#nodeVisualization').children().fadeOut('fast');
    }
}
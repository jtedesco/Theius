/**
 * Shows a pie chart of the log data types, based on the logs generate at that node
 */
function PieChartNodeVisualization(nodeState) {

    var This = this;

    // The identifier for the node being visualized
    this.nodeName = nodeState.name;

    // The state for this node
    this.nodeState = nodeState;


    /**
     * Gets the label corresponding to the severity level of the log (0-3)
     */
    var getEventLevel = function(level) {
        var eventLevel = null;
        switch (level) {
            case 0:
                eventLevel = 'INFO';
                break;
            case 1:
                eventLevel = 'WARN';
                break;
            case 2:
                eventLevel = 'ERROR';
                break;
            case 3:
                eventLevel = 'FATAL';
                break;
        }
        return eventLevel;
    };


    /**
     * Gets a dictionary containing the fraction of logs that are at each log level
     */
    var getLogsByLevel = function() {
        var eventsByLevel = {
            INFO: [],
            WARN: [],
            ERROR: [],
            FATAL: []
        };

        var totalEventCount = 0;
        for(var index in nodeState.events) {
            if(nodeState.events.hasOwnProperty(index)) {

                var event = nodeState.events[index];
                var eventLevel = event.severity;

                console.log(eventsByLevel, event, eventLevel);
                eventsByLevel[eventLevel].push(event);
                totalEventCount++;
            }
        }

        eventsByLevel['totalCount'] = totalEventCount;

        return eventsByLevel;
    };


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

        var eventsByLevel = getLogsByLevel();
        var nodeVisualizationDiv = $('#nodeVisualization');

        if(eventsByLevel['totalCount'] > 0) {
            var width = nodeVisualizationDiv.width(),
                height = nodeVisualizationDiv.height()-50,
                outerRadius = Math.min(width, height) / 2,
                innerRadius = outerRadius * .6,
                data = d3.range(4).map(function(i) {
                    return eventsByLevel[getEventLevel(i)].length / eventsByLevel['totalCount'];
                }),
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
                .text(function(d, i) {
                    var eventLevel = getEventLevel(i);
                    return eventLevel + ':   ' + eventsByLevel[eventLevel].length + '/' + eventsByLevel['totalCount'];
                });
        } else {
            nodeVisualizationDiv.html('<br/><br/><h4>No logs to display!</h4>')
        }
        // Actually show the node visualization
        showNodeVisualization();
    };


    /**
     * Updates the active nodeVisualization with the node's new state
     */
    this.update = function(newNodeState) {

        This.nodeState = newNodeState;


    };


    /**
     * Deconstructs this node visualization (and in general, the active node visualization)
     */
    this.deconstruct = function() {
        $('#nodeVisualization').children().fadeOut('fast');
    }
}
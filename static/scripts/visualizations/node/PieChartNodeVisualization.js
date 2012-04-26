/**
 * Shows a pie chart of the log data types, based on the logs generate at that node
 */
function PieChartNodeVisualization() {

    var This = this;
    var nodeState = selectedNodeState;

    // The identifier for the node being visualized
    this.nodeName = nodeState.name;

    // The state for this node
    this.nodeState = nodeState;

    // The current data set configuration (severity or facility)
    this.dataSet = 'severity';


    /**
     * Gets the array of possible values of event labels
     */
    var getLabels = function() {
        if(This.dataSet === 'severity') {
            return [
                'INFO',
                'WARN',
                'ERROR',
                'FATAL'
            ];
        } else {
            return [
                'MMCS',
                'APP',
                'KERNEL',
                'LINKCARD',
                'MONITOR',
                'HARDWARE',
                'DISCOVERY'
            ];
        }
    };


    /**
     * Gets the label corresponding to the severity level of the log (0-3), or facility
     */
    var getEventLabel = function(level) {
        return getLabels()[level];
    };


    /**
     * Gets a dictionary containing the fraction of logs that are at each log level or facility
     */
    var groupLogs = function() {

        var eventsByLevel = {};
        var totalEventCount = 0;

        var labels = getLabels();
        for(var i in labels) {
            if(labels.hasOwnProperty(i)) {
                eventsByLevel[labels[i]] = [];
            }
        }

        for(var index in nodeState.events) {
            if(nodeState.events.hasOwnProperty(index)) {

                var event = nodeState.events[index];
                var eventLabel = event[This.dataSet];

                eventsByLevel[eventLabel].push(event);
                totalEventCount++;
            }
        }

        eventsByLevel['totalCount'] = totalEventCount;

        return eventsByLevel;
    };


    /**
     * Sets the 'dataSet' parameter
     */
    this.setDataSet = function(dataSet) {
        This.dataSet = dataSet;
    };


    /**
     * Gets the identifier for the node being visualization
     */
    this.getNodeName = function() {
        return This.nodeName;
    };


    /**
     * Helper function to draw the pie graph, assuming there is nothing in the node visualization yet
     */
    var drawPieGraph = function(eventsByLevel) {

        var nodeVisualizationDiv = $('#nodeVisualization');

        // Update the node stats
        $('#nodeVisualizationStats').html(generateNodePopoverContent(This.nodeState, true));

        // Setup the basic visualization
        var dim = Math.min(nodeVisualizationDiv.width(), nodeVisualizationDiv.height() - 50),
            outerRadius = Math.min(dim) / 2,
            innerRadius = outerRadius * .6,
            data = d3.range(getLabels().length).map(function (i) {
                var eventLevel = getEventLabel(i);
                var eventsAtThisLevel = eventsByLevel[eventLevel].length;
                return eventsAtThisLevel / eventsByLevel.totalCount;
            }),
            color = d3.scale.category20b(),
            donut = d3.layout.pie(),
            arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        var vis = d3.select("#nodeVisualization")
            .append("svg")
            .data([data])
            .attr("width", dim)
            .attr("height", dim);

        // Add arcs for all new data points
        var arcs = vis.selectAll("g.arc")
            .data(donut, function (d, i) {
                var level = getEventLabel(i);
                d.data = {
                    percentage:d.data,
                    level:level,
                    count:eventsByLevel[level].length,
                    totalCount:eventsByLevel.totalCount
                };
                return i;
            })
            .enter().append("g")
            .attr("class", "arc")
            .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

        // Color based on the event level severity
        var a = arcs.append("path")
            .attr("fill", function (d, i) {
                return color(i);
            })
            .attr("d", arc);

        // Add text containing the level & total & partial counts
        arcs.append("text")
            .attr("transform", function (d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function (d, i) {
                return d.value < 0.05 ? null : d.data.level + ':   ' + d.data.count + '/' + d.data.totalCount;
            });
    };


    /**
     * Builds the node visualization
     */
    this.construct = function() {

        var eventsByLevel = groupLogs();
        var nodeVisualizationDiv = $('#nodeVisualization');

        if(eventsByLevel['totalCount'] > 0) {
            drawPieGraph(eventsByLevel);
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
        $('#nodeVisualization').children().remove();
        drawPieGraph(groupLogs());
    };


    /**
     * Deconstructs this node visualization (and in general, the active node visualization)
     */
    this.deconstruct = function() {
        $('#nodeVisualization').children().fadeOut('fast');
    }
}
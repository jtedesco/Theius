/**
 * Shows a stream graph of the distribution of logs or
 */
function StreamGraphNodeVisualization() {

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
     * Function that creates an array of as many levels as correspond to the length of 'getLabels()', given the
     *  number of samples.
     */
    var streamLayers = function(numberOfSamples) {

        var logs = groupLogs();
        var labels = getLabels();

        // Find the label of the severity of the log with the most recent event in 'logs'
        var findMaxNext = function(logs) {

            var maxLabel, maxTimestamp;

            for(var i in labels) {
                if(labels.hasOwnProperty(i)) {
                    var label = labels[i];
                    var nextEvent = logs[label][logs[label].length - 1];

                    if(nextEvent && (!maxLabel && !maxTimestamp) || (nextEvent.timestamp > maxTimestamp)) {
                        maxLabel = label;
                        maxTimestamp = nextEvent.timestamp;
                    }
                }
            }

            return maxLabel;
        };

        // Holds the layers
        var layers = [];
        for(i=0; i<labels.length; i++) {
            layers.push([]);
        }

        // Build the stream data
        for(var i=0; i<numberOfSamples; i++) {

            var nextMaxLabel = findMaxNext(logs);

            logs[nextMaxLabel].pop(); // Remove the last element
            var indexToAddElement = labels.indexOf(nextMaxLabel);

            for(var j=0; j<labels.length; j++) {
                var oldValue = i === 0 ? 1.0 : layers[j][i-1];
                if(indexToAddElement === j) {
                    layers[j].push(oldValue+1.0);
                } else {
                    layers[j].push(oldValue);
                }
            }
        }

        return layers;
    };


    /**
     * Helper function to draw the stream graph, assuming there is nothing in the node visualization yet
     */
    var drawStreamGraph = function() {

        var nodeVisualizationDiv = $('#nodeVisualization');

        // Update the node stats
        $('#nodeVisualizationStats').html(generateNodePopoverContent(This.nodeState, true));

        var numberOfSamples = 10, // number of samples per layer
            layersData = streamLayers(numberOfSamples),
            data0 = d3.layout.stack().offset("wiggle")(layersData),
            data1 = d3.layout.stack().offset("wiggle")(layersData),
            color = d3.interpolateRgb("#aad", "#556");

        var width = nodeVisualizationDiv.width(),
            height = nodeVisualizationDiv.height()-50,
            mx = numberOfSamples - 1,
            my = d3.max(data0.concat(data1), function(d) {
                return d3.max(d, function(d) {
                    return d.y0 + d.y;
                });
            });

        var area = d3.svg.area()
            .x(function(d) { return d.x * width / mx; })
            .y0(function(d) { return height - d.y0 * height / my; })
            .y1(function(d) { return height - (d.y + d.y0) * height / my; });

        console.log(area);

        var vis = d3.select("#nodeVisualization")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        vis.selectAll("path")
            .data(data0)
            .enter().append("path")
            .style("fill", function() { return color(Math.random()); })
            .attr("d", area);

        function transition() {
            d3.selectAll("path")
                .data(function() {
                    var d = data1;
                    data1 = data0;
                    return data0 = d;
                })
                .transition()
                .duration(500)
                .attr("d", area);
        }
    };


    /**
     * Builds the node visualization
     */
    this.construct = function() {

        var eventsByLevel = groupLogs();
        var nodeVisualizationDiv = $('#nodeVisualization');

        if(eventsByLevel['totalCount'] > 0) {
            drawStreamGraph();
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
    };
}
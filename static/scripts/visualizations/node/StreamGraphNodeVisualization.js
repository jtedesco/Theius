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

    /* Inspired by Lee Byron's test data generator. */
    function stream_layers(n, m, o) {
        if (arguments.length < 3) o = 0;
        function bump(a) {
            var x = 1 / (.1 + Math.random()),
                y = 2 * Math.random() - .5,
                z = 10 / (.1 + Math.random());
            for (var i = 0; i < m; i++) {
                var w = (i / m - y) * z;
                a[i] += x * Math.exp(-w * w);
            }
        }
        return d3.range(n).map(function() {
            var a = [], i;
            for (i = 0; i < m; i++) a[i] = o + o * Math.random();
            for (i = 0; i < 5; i++) bump(a);
            return a.map(stream_index);
        });
    }

    /* Another layer generator using gamma distributions. */
    function stream_waves(n, m) {
        return d3.range(n).map(function(i) {
            return d3.range(m).map(function(j) {
                var x = 20 * j / m - i / 3;
                return 2 * x * Math.exp(-.5 * x);
            }).map(stream_index);
        });
    }

    function stream_index(d, i) {
        return {x: i, y: Math.max(0, d)};
    }

    /**
     * Helper function to draw the stream graph, assuming there is nothing in the node visualization yet
     */
    var drawStreamGraph = function() {

        console.log('stream');

        var nodeVisualizationDiv = $('#nodeVisualization');

        // Update the node stats
        $('#nodeVisualizationStats').html(generateNodePopoverContent(This.nodeState, true));

        var n = getLabels().length, // number of layers
            m = 100, // number of samples per layer
            data0 = d3.layout.stack().offset("wiggle")(stream_layers(n, m)),
            data1 = d3.layout.stack().offset("wiggle")(stream_layers(n, m)),
            color = d3.interpolateRgb("#aad", "#556");

        var width = nodeVisualizationDiv.width(),
            height = nodeVisualizationDiv.height()-50,
            mx = m - 1,
            my = d3.max(data0.concat(data1), function(d) {
                return d3.max(d, function(d) {
                    return d.y0 + d.y;
                });
            });

        var area = d3.svg.area()
            .x(function(d) { return d.x * width / mx; })
            .y0(function(d) { return height - d.y0 * height / my; })
            .y1(function(d) { return height - (d.y + d.y0) * height / my; });

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
        console.log(nodeState);

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
    }
}
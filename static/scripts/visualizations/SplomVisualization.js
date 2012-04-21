/**
 * Class that implements a visualization for
 */
function SplomVisualization(structure, state, predictions) {

    // Build the traits to use for visualizing (parametrized)
    var predictionTraits = [
        'predictedSeverityProbabilities.INFO',
        'predictedSeverityProbabilities.WARN',
        'predictedSeverityProbabilities.ERROR',
        'predictedSeverityProbabilities.FATAL'
    ];
    var statsTraits = [
        'cpuUsage',
        'memoryUsage',
        'contextSwitchRate'
    ];
    var traits = predictions ? predictionTraits : statsTraits;

    // Selected data sets to use for color & size (respectively)
    var This = this;


    /**
     * Set the data set that will determine the color of nodes
     */
    this.setColorDataSet = function(dataSet) {
        This.colorDataSet = dataSet;
    };


    /**
     * Set the data that will determine the size of nodes
     */
    this.setSizeDataSet = function(dataSet) {
        switch(dataSet) {
            case 'cpuUsage':
            case 'memoryUsage':
            case 'contextSwitchRate':
                This.sizeDataSet = dataSet;
                break;
            case 'INFO':
            case 'WARN':
            case 'ERROR':
            case 'FATAL':
                This.sizeDataSet = 'predictedSeverityProbabilities.' + dataSet;
                break;
            default:
                console.log('Invalid data set for size: ' + dataSet);
        }
    };


    /**
     * Returns the list of possible metrics on which to the node colors for this visualization
     */
    this.getColorDataSets = function() {
        return {
            rack : 'By Rack'
        };
    };


    /**
     * Returns the list of possible metrics on which to the node sizes for this visualization
     */
    this.getSizeDataSets = function() {
        return {
            FATAL: 'Probability of FATAL Event',
            ERROR: 'Probability of ERROR Event',
            WARN: 'Probability of WARN Event',
            INFO: 'Probability of INFO Event',
            cpuUsage: 'Node CPU Usage (%)',
            memoryUsage: 'Node Memory Usage (%)',
            contextSwitchRate: 'Node Context Switch Rate (%)'
        };
    };

    // Build the list form of data entries
    var values = [];
    for (var name in state) {
        if (state.hasOwnProperty(name) && name.indexOf('master') === -1) {
            values.push(state[name]); // Get a handle on the state of this machine, which will update
        }
    }

    // Build the list of rack names
    var racks = buildRacksData();

    // The core data for the visualization
    var data = {
        traits: traits,
        rack: racks,
        values: values
    };


    this.initialize = function() {

        // Size parameters.
        var verticalSize = $('#visualization').height()/data.traits.length - 10,
            horizontalSize = $('#visualization').width()/data.traits.length - 10,
            padding = 20;

        // Size parameters.
        var n = data.traits.length;

        // Position scales.
        var x = {}, y = {};
        data.traits.forEach(function(trait) {
            var value = function(machineData) {
                return getCompoundKeyFromDict(machineData, trait);
            },
                domain = [d3.min(data.values, value), d3.max(data.values, value)],
                xRange = [padding / 2, horizontalSize - padding / 2],
                yRange = [padding / 2, verticalSize - padding / 2];
            x[trait] = d3.scale.linear()
                .domain(domain)
                .range(xRange);

            y[trait] = d3.scale.linear()
                .domain(domain)
                .range(yRange.slice().reverse());
        });

        // Axes.
        var xAxis = d3.svg.axis()
            .ticks(5)
            .tickSize(horizontalSize * n);
        var yAxis = d3.svg.axis()
            .ticks(5)
            .tickSize(verticalSize * n);

        // Brush.
        var brush = d3.svg.brush()
            .on("brushstart", brushstart)
            .on("brush", brush)
            .on("brushend", brushend);

        // Root panel.
        var svg = d3.select("#visualization").append("svg")
            .attr("width", horizontalSize * n + padding)
            .attr("height", verticalSize * n + padding);

        // X-axis.
        svg.selectAll("g.x.axis")
            .data(data.traits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, i) { return "translate(" + i * horizontalSize + ",0)"; })
            .each(function(d) { d3.select(this).call(yAxis.scale(x[d]).orient("bottom")); });

        // Y-axis.
        svg.selectAll("g.y.axis")
            .data(data.traits)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", function(d, i) { return "translate(0," + i * verticalSize + ")"; })
            .each(function(d) { d3.select(this).call(xAxis.scale(y[d]).orient("right")); });

        // Cell and plot.
        var cell = svg.selectAll("g.cell")
            .data(cross(data.traits, data.traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + d.i * horizontalSize + "," + d.j * verticalSize + ")"; })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) { return d.i == d.j; }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function(d) {
                var key = d.x;
                var keys = key.split('.');
                if (keys.length >= 2) {
                    return keys[1];
                } else {
                    return keys[0];
                }
            });

        function plot(p) {
            var cell = d3.select(this);

            // Plot frame.
            cell.append("rect")
                .attr("class", "frame")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", horizontalSize - padding)
                .attr("height", verticalSize - padding);

            // Plot dots.
            cell.selectAll("circle")
                .data(data.values)
                .enter().append("circle")
                .attr("class", function(d) { return d.rack + ' splomCircle'; })
                .attr("id", function(node) {
                    return node.name;
                })
                .attr("cx", function(d) {
                    return x[p.x](getCompoundKeyFromDict(d, p.x));
                })
                .attr("cy", function(d) {
                    return y[p.y](getCompoundKeyFromDict(d, p.y));
                })
                .attr("r", 3);

            // Plot brush.
            cell.call(brush.x(x[p.x]).y(y[p.y]));
        }

        // Clear the previously-active brush, if any.
        function brushstart(p) {
            if (brush.data !== p) {
                cell.call(brush.clear());
                brush.x(x[p.x]).y(y[p.y]).data = p;
            }
        }

        // Highlight the selected circles.
        function brush(p) {
            var e = brush.extent();
            svg.selectAll("circle").attr("class", function(d) {

                var xVal = getCompoundKeyFromDict(d, p.x);
                var yVal = getCompoundKeyFromDict(d, p.y);

                return e[0][0] <= xVal && xVal <= e[1][0]
                    && e[0][1] <= yVal && yVal <= e[1][1]
                    ? d.rack + ' splomCircle': 'splomCircle';
            });
        }

        // If the brush is empty, select all circles.
        function brushend() {
            if (brush.empty()) svg.selectAll("circle").attr("class", function(d) {
                return d.rack + ' splomCircle';
            });
        }

        function cross(a, b) {
            var c = [], n = a.length, m = b.length, i, j;
            for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
            return c;
        }


        showVisualization();
    };

    this.update = function() {

        // Size parameters.
        var verticalSize = $('#visualization').height()/data.traits.length - 10,
            horizontalSize = $('#visualization').width()/data.traits.length - 10,
            padding = 20;

        // Position scales.
        var x = {}, y = {};
        data.traits.forEach(function(trait) {
            var value = function(machineData) {
                return getCompoundKeyFromDict(machineData, trait);
            },
                domain = [d3.min(data.values, value), d3.max(data.values, value)],
                xRange = [padding / 2, horizontalSize - padding / 2],
                yRange = [padding / 2, verticalSize - padding / 2];
            x[trait] = d3.scale.linear()
                .domain(domain)
                .range(xRange);

            y[trait] = d3.scale.linear()
                .domain(domain)
                .range(yRange.slice().reverse());
        });

        function replot(p) {

            var cell = d3.select(this);

            // Plot dots.
            cell.selectAll("circle")
                .attr("cx", function(d) {
                    return x[p.x](getCompoundKeyFromDict(d, p.x));
                })
                .transition()
                .duration(300)
                .attr("cy", function(d) {
                    return y[p.y](getCompoundKeyFromDict(d, p.y));
                })
                .transition()
                .duration(300)
                .attr("r", 3)
                .transition()
                .duration(300);
        }


        // Cell and plot
        var svg = d3.select("svg");
        var cell = svg.selectAll("g.cell")
            .each(replot);

    };

    this.title = function() {
        return "Scatterplot Matrix Showing Probabilities of Event Types by Rack"
    };

    // Helper function to return the value of some dictionary or nested dictionary by splitting on '.' character
    var getCompoundKeyFromDict = function(dictionary, key) {
        var keys = key.split('.');
        if (keys.length > 2) {
            console.log('Cannot use more than one level of nested keys!');
            return null;
        } else if (keys.length === 2) {
            return dictionary[keys[0]][keys[1]];
        } else {
            return dictionary[keys[0]];
        }
    };
}
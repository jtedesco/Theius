/**
 * Class that implements a visualization for
 */
function SplomVisualization(structure, state) {


    // Get the racks to build the categories list of points
    var racks = [];
    if(structure.hasOwnProperty('children')) {
        for(var i in structure['children']) {
            if (structure['children'].hasOwnProperty(i)) {
                var rack = structure['children'][i];
                var rackName = rack['name'];

                if($.inArray(rackName, racks) < 0) {
                    racks.push(rackName);
                }

                var rack2 = rack['children'];
                for (var j in rack2) {
                    if (rack['children'].hasOwnProperty(j)) {
                        var machineName = rack['children'][j]['name'];
                        state[machineName]['rack'] = rack['name'];
                    }
                }
            }
        }
    }

    // Build the traits to use for visualizing
    var traits = [
        'predictedSeverityProbabilities.INFO',
        'predictedSeverityProbabilities.WARN',
        'predictedSeverityProbabilities.ERROR',
        'predictedSeverityProbabilities.FATAL'
    ];

    // Form the data
    var values = [];
    for (var name in state) {
        if (state.hasOwnProperty(name) && name.indexOf('master') === -1) {
            values.push(state[name]); // Get a handle on the state of this machine, which will update
        }
    }


    var data = {
        traits: traits,
        rack: racks,
        values: values
    };


    this.initialize = function() {
        matrixPlot(data, getCompoundKeyFromDict);
    };

    this.update = function() {
        $('svg').remove();
        matrixPlot(data, getCompoundKeyFromDict);
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

/**
 * Adapted from d3's online example
 * @param data  The data to plot
 */
function matrixPlot(data, getCompoundKeyFromDict) {

    // Size parameters.
    var size = $('#visualizationWrapper').width()/data.traits.length - 10,
        padding = 20,
        n = data.traits.length;

    // Position scales.
    var x = {}, y = {};
    data.traits.forEach(function(trait) {
        var value = function(machineData) {
            return getCompoundKeyFromDict(machineData, trait);
        },
            domain = [d3.min(data.values, value), d3.max(data.values, value)],
            range = [padding / 2, size - padding / 2];
        x[trait] = d3.scale.linear()
            .domain(domain)
            .range(range);

        y[trait] = d3.scale.linear()
            .domain(domain)
            .range(range.slice().reverse());
    });

    // Axes.
    var axis = d3.svg.axis()
        .ticks(5)
        .tickSize(size * n);

    // Brush.
    var brush = d3.svg.brush()
        .on("brushstart", brushstart)
        .on("brush", brush)
        .on("brushend", brushend);

    // Root panel.
    var svg = d3.select(".visualization").append("svg")
        .attr("width", size * n + padding)
        .attr("height", size * n + padding);

    // X-axis.
    svg.selectAll("g.x.axis")
        .data(data.traits)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
        .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

    // Y-axis.
    svg.selectAll("g.y.axis")
        .data(data.traits)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

    // Cell and plot.
    var cell = svg.selectAll("g.cell")
        .data(cross(data.traits, data.traits))
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
        .each(plot);

    // Titles for the diagonal.
    cell.filter(function(d) { return d.i == d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

    function plot(p) {
        var cell = d3.select(this);

        // Plot frame.
        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        // Plot dots.
        cell.selectAll("circle")
            .data(data.values)
            .enter().append("circle")
            .attr("class", function(d) { return d.rack + ' splomCircle'; })
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
            console.log(d);
            return d.rack + ' splomCircle';
        });
    }

    function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
        return c;
    }
}
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

    var This = this;
    this.state = state;
    this.structure = structure;

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

    // set the structure of this visualization
    this.setStructure = function(newStructure) {
        This.structure = newStructure;
    };

    // set the state of this visualization
    this.setState = function(newState) {
        This.state = newState;
    };


    /**
     * Sizes a point by looking at the size data set
     */
    var sizePoint = function(node) {
        return getCompoundKeyFromDict(node, This.sizeDataSet) * 5 + 2;
    };


    // Build the list form of data entries
    var values = [];
    for (var name in This.state) {
        if (This.state.hasOwnProperty(name) && name.indexOf('master') === -1) {
            values.push(This.state[name]); // Get a handle on the state of this machine, which will update
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

    // Size parameters.
    var verticalSize = $('#visualization').height()/data.traits.length - 10,
        horizontalSize = $('#visualization').width()/data.traits.length - 10,
        padding = 20;


   /**
     * Convert the node data (in 'data.values') into points for plotting
     */
    var convertDataToPoints = function() {

        // Position scales.
        var x = {}, y = {};
        data.traits.forEach(function (trait) {
            var value = function (machineData) {
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
        return {x:x, y:y};
    };


    // Helper function for computing the grid of cells
    function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x:a[i], i:i, y:b[j], j:j});
        return c;
    }


    /**
     * Initialize the axises for the entire plot matrix
     */
    var initializeAxises = function(svg, yAxis, x, xAxis, y) {

        // X-axis.
        svg.selectAll("g.x.axis")
            .data(data.traits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function (d, i) {
                return "translate(" + i * horizontalSize + ",0)";
            })
            .each(function (d) {
                d3.select(this).call(yAxis.scale(x[d]).orient("bottom"));
            });

        // Y-axis.
        svg.selectAll("g.y.axis")
            .data(data.traits)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", function (d, i) {
                return "translate(0," + i * verticalSize + ")";
            })
            .each(function (d) {
                d3.select(this).call(xAxis.scale(y[d]).orient("right"));
            });
    };


    /**
     * Helper function to initialize all cells
     */
    var plotCells = function(svg, x, y, brush) {

        /**
         * Helper function to plot all points for a cell
         */
        var plot = function (p) {
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
                .attr("class", function (d) {
                    return d.rack + ' splomCircle';
                })
                .attr("id", function (node) {
                    return node.name;
                })
                .attr("cx", function (d) {
                    return x[p.x](getCompoundKeyFromDict(d, p.x));
                })
                .attr("cy", function (d) {
                    return y[p.y](getCompoundKeyFromDict(d, p.y));
                })
                .attr("r", sizePoint);

            // Plot brush.
            cell.call(brush.x(x[p.x]).y(y[p.y]));
        };

        // Cell and plot.
        var cell = svg.selectAll("g.cell")
            .data(cross(data.traits, data.traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function (d) {
                return "translate(" + d.i * horizontalSize + "," + d.j * verticalSize + ")";
            })
            .each(plot);

        // Add titles for the diagonal cells
        cell.filter(function (d) {
                return d.i == d.j;
            })
            .append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function (d) {
                var key = d.x;

                // Take only the second part of a compound key, or the full key for a non-compound one
                var keys = key.split('.');
                if (keys.length >= 2) {
                    return keys[1];
                } else {
                    return keys[0];
                }
            });

        return cell;
    };


    /**
     * Helper function to initialize the brush listeners, for clicking & selecting a rectangle
     */
    var initializeBrushes = function(svg, brush, cell, x, y) {
        // Attach brush functionality
        brush.on("brushstart", onBrushStart)
            .on("brush", onBrush)
            .on("brushend", onBrushEnd);

        // Clear the previously-active brush, if any.
        function onBrushStart(p) {
            if (brush.data !== p) {
                cell.call(brush.clear());
                brush.x(x[p.x]).y(y[p.y]).data = p;
            }
        }

        // Highlight the selected circles.
        function onBrush(p) {
            var e = brush.extent();
            svg.selectAll("circle").attr("class", function (d) {

                var xVal = getCompoundKeyFromDict(d, p.x);
                var yVal = getCompoundKeyFromDict(d, p.y);

                return e[0][0] <= xVal && xVal <= e[1][0]
                    && e[0][1] <= yVal && yVal <= e[1][1]
                    ? d.rack + ' splomCircle' : 'splomCircle';
            });
        }

        // If the brush is empty, select all circles.
        function onBrushEnd() {
            if (brush.empty()) svg.selectAll("circle").attr("class", function (d) {
                return d.rack + ' splomCircle';
            });
        }
    };


    /**
     * Get the title of this visualization
     */
    this.title = function() {
        return "Scatterplot Matrix Showing Probabilities of Event Types by Rack"
    };


    /**
     * Return the content to put in the 'legend' div
     */
    this.getLegendContent = function() {
        var content = "<table>";
        for(var i in racks) {
            if(racks.hasOwnProperty(i)) {
                var rackName = racks[i];
                content += "<tr>" +
                        "<td>" +
                            "<svg style='width:10px; height:10px;'><circle class='" + rackName + "' cx=5 cy=5 r=5></svg>" +
                        "</td>" +
                        "<td style='padding-left:10px;'>Belongs to " + rackName + "</td>" +
                    "</tr>"
            }
        }
        content += "</table>";
        return content;
    };


    /**
     * Plot this visualization for the first time
     */
    this.initialize = function() {

        // Size parameters.
        var n = data.traits.length;

        // Convert the data for nodes into points to be plotted
        var __ret = convertDataToPoints();
        var x = __ret.x;
        var y = __ret.y;

        // Axes.
        var xAxis = d3.svg.axis()
            .ticks(5)
            .tickSize(horizontalSize * n);
        var yAxis = d3.svg.axis()
            .ticks(5)
            .tickSize(verticalSize * n);

        // Brush.
        var brush = d3.svg.brush();

        // Root panel.
        var svg = d3.select("#visualization").append("svg")
            .attr("width", horizontalSize * n + padding)
            .attr("height", verticalSize * n + padding);

        // Initialize the axises for all cells
        initializeAxises(svg, yAxis, x, xAxis, y);

        // Init
        var cell = plotCells(svg, x, y, brush);

        // Setup the brush listeners (for clicking & selecting points)
        initializeBrushes(svg, brush, cell, x, y);

        // Reveal the visualization
        showVisualization();
    };


    /**
     * Updates the splom visualization by looking at the newest cluster state
     */
    this.update = function() {


        // Convert the data for nodes into points to be plotted
        var __ret = convertDataToPoints();
        var x = __ret.x;
        var y = __ret.y;

        /**
         * Helper function to replot a set of points on a cell (just moving points, not redrawing them)
         */
        var replot = function(p) {

            var cell = d3.select(this);

            // Plot dots, animating from their previous positions to new ones, and old radii to new ones
            cell.selectAll("circle")
                .attr("cx", function(d) {
                    return x[p.x](getCompoundKeyFromDict(d, p.x));
                })
                .transition()
                .attr("cy", function(d) {
                    return y[p.y](getCompoundKeyFromDict(d, p.y));
                })
                .transition()
                .attr("r", sizePoint)
                .transition()
        };

        // Cell and plot
        var svg = d3.select("#visualization svg");
        var cell = svg.selectAll("g.cell")
            .each(replot);

    };
}

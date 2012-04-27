/**
 * Visualization using a chord diagram to visualization correlations between nodes in the cluster
 */
function ChordDiagramVisualization(structure, state) {

    // Selected data sets to use for color & size (respectively)
    var This = this;

    // Holds the list of machines (in the order in which they appear in the data matrix)
    var machines = null;

    // Holds the current matrix of data
    var matrix = null;

    // Build the list of rack names
    var racks = buildRacksData();


    /**
     * Build the matrix of node-node comparisons (that will represent the outer chords & arcs of the diagram). We use the
     *  sizeDataSet property of the visualization to generate this data (all data is assumed to be in the range [0,1].
     */
    var buildMatrixData = function() {

        machines = [];

        // Collect a list of the machines (excluding racks)
        for(var machineName in clusterState) {
            if(clusterState.hasOwnProperty(machineName)) {
                var machineState = clusterState[machineName];

                // Only look at machines that are actually machines (not racks or the master node)
                if(machineState.hasOwnProperty('rack')) {
                    machines.push(machineState);
                }
            }
        }

        // Will hold the matrix of data
        matrix = [];

        for(machineName in machines) {
            if(machines.hasOwnProperty(machineName)) {

                var machine = machines[machineName];
                var matrixRow = [];

                for(var otherMachineName in machines) {
                    if(machines.hasOwnProperty(otherMachineName)) {
                        var otherMachine = machines[otherMachineName];

                        // Make the diagonal entries (this machine compared to itself) 0, otherwise, actual try to get
                        if(machineName != otherMachineName) {

                            var machineValue = getCompoundKeyFromDict(machine, This.sizeDataSet);
                            var otherMachineValue = getCompoundKeyFromDict(otherMachine, This.sizeDataSet);

                            // Cube the 'correlation' to make large correlation dominate small ones, and remove very thin arcs for performances
                            var diff = Math.abs(machineValue - otherMachineValue);
                            var machineCorrelation = diff*diff*1000;
                            if(machineCorrelation < 5) {
                                machineCorrelation = 0.01;
                            }

                            matrixRow.push(machineCorrelation);

                        } else {
                            matrixRow.push(0.01);
                        }
                    }
                }

                matrix.push(matrixRow);
            }
        }

        return matrix;
    };


    /**
     * Helper function to build an array of colors, corresponding to machines (in the same order as the list of
     */
    var buildMatrixColors = function() {

        var color = d3.scale.category20();

        var colors = [];

        for(var machineName in machines) {
            if(machines.hasOwnProperty(machineName)) {
                colors.push(color(state[machines[machineName].name][This.colorDataSet]));
            }
        }

        return colors;
    };


    /**
     * Set the data set that will determine the color of arcs
     */
    this.setColorDataSet = function(dataSet) {
        This.colorDataSet = dataSet;
    };


    /**
     * Set the data that will determine the size of arcs
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

    // set the structure of this visualization
    this.setStructure = function(newStructure) {
        structure = newStructure;
    };

    // set the state of this visualization
    this.setState = function(newState) {
        state = newState;
    };


    /**
     * Returns the list of possible metrics on which to the arc colors for this visualization
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


    /**
     * Gets the title for this visualization
     */
    this.title = function() {
        return "Chord Diagram of Similarity Between Nodes";
    };


    /**
     * Builds the legend content
     */
    this.getLegendContent = function() {

        var color = d3.scale.category20();

        // Create a divs
        var content = "<table>";
        for(var i in racks) {
            if(racks.hasOwnProperty(i)) {
                var rackName = racks[i];
                content += "<tr>" +
                        "<td>" +
                        "<div style='width:10px; height:10px; background-image: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color:" + color(rackName) + "'></div>" +
                        "</td>" +
                        "<td style='padding-left:10px;'>Belongs to " + rackName + "</td>" +
                    "</tr>"
            }
        }
        content += "</table>";
        return content;
    };


    /**
     * Returns an event handler for fading a given chord group to a specified opacity
     *  @param  opacity The new opacity of the chord group
     */
    var fadeToOpacity = function(opacity) {
        var svg = d3.select("#visualization");
        return function(g, i) {
            svg.selectAll("g.chord path")
                .filter(function(d) {
                    return d.source.index != i && d.target.index != i;
                })
                .transition()
                .style("opacity", opacity);
        };
    };


    /**
     * Returns an array of tick angles and labels, given a group.
     */
    var groupTicks = function(d) {
        var k = (d.endAngle - d.startAngle) / 2;
        return [{
            angle: k + d.startAngle,
            label: machines[d.index].name
        }];
    };

    // Compute the visualization size
    var width = $("#visualization").width(),
        height = $("#visualization").height(),
        innerRadius = Math.min(width, height) * .35,
        outerRadius = innerRadius * 1.11;

    function drawChordDiagram() {

        // Build the basic chord diagram
        var chord = d3.layout.chord()
            .padding(.05)
            .sortSubgroups(d3.descending)
            .matrix(buildMatrixData());

        // Define the color scheme for
        var fill = d3.scale.ordinal()
            .domain(d3.range(machines.length))
            .range(buildMatrixColors());

        // Add the diagram
        var svg = d3.select("#visualization")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // Add the paths
        svg.append("g")
            .selectAll("path")
            .data(chord.groups)
            .enter().append("path")
            .style("fill", function(d) { return fill(d.index); })
            .style("stroke", function(d) { return fill(d.index); })
            .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
            .on("mouseover", fadeToOpacity(.1))
            .on("mouseout", fadeToOpacity(1))
            .on('click', function(d) {
                createNodeVisualization(machines[d.index].name);
            });

        // Add the tick elements in place around the arc (& blocks
        var ticks = svg.append("g")
            .selectAll("g")
            .data(chord.groups)
            .enter().append("g")
            .selectAll("g")
            .data(groupTicks)
            .enter().append("g")
            .attr("transform", function(d) {
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                    + "translate(" + outerRadius + ",0)";
            });

        // Add the text labels for each node
        ticks.append("text")
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) {
                return d.angle > Math.PI ? "end" : null;
            })
            .attr("transform", function(d) {
                return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
            })
            .text(function(d) { return d.label; });


        // Add the arcs for the chord diagram
        svg.append("g")
            .attr("class", "chord")
            .selectAll("path")
            .data(chord.chords)
            .enter().append("path")
            .style("fill", function(d) {return fill(d.target.index); })
            .style("stroke", "rgba(0, 0, 0, 0.1)")
            .attr("d", d3.svg.chord().radius(innerRadius))
            .style("opacity", 1)
            .attr('display', function(d) {
                return d.source.value > 0.01 ? "" : "none";
            })
    }

    /**
     * Initialize visualization for the first time
     */
    this.initialize = function() {
        $('#visualization svg').remove();
        drawChordDiagram();
        showVisualization();
    };

    this.update = function() {

        if(This.sizeDataSet) {
            $('#visualization svg').remove();
            drawChordDiagram();
       }
    }
}
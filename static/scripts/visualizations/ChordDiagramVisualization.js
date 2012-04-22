/**
 * Visualization using a chord diagram to visualization correlations between nodes in the cluster
 */
function ChordDiagramVisualization(structure, state) {


    // Selected data sets to use for color & size (respectively)
    var This = this;


    /**
     * Helper function to return the value of some dictionary or nested dictionary by splitting on '.' character
     */
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
        for(var machineName in clusterState) {
            if(clusterState.hasOwnProperty(machineName)) {
                var machineState = clusterState[machineName];

                // Only look at machines that are actually machines (not racks or the master node)
                if(machineState.hasOwnProperty('rack')) {
                    machines.push(machineState);
                }
            }
        }

        matrix = [];
        for(machineName in machines) {
            if(machines.hasOwnProperty(machineName)) {

                var machine = machines[machineName];
                var matrixRow = [];

                for(var otherMachineName in machines) {
                    if(machines.hasOwnProperty(otherMachineName)) {
                        var otherMachine = machines[otherMachineName];

                        if(machineName != otherMachineName) {

                            var machineValue = getCompoundKeyFromDict(machine, This.sizeDataSet);
                            var otherMachineValue = getCompoundKeyFromDict(otherMachine, This.sizeDataSet);
                            matrixRow.push(Math.abs(machineValue - otherMachineValue) * 1000);

                        } else {
                            matrixRow.push(0);
                        }
                    }
                }

                matrix.push(matrixRow);
            }
        }

        return matrix;
    };


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


    this.title = function() {
        return "Chord Diagram of Similarity Between Nodes";
    };


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


    this.initialize = function() {

        // From http://mkweb.bcgsc.ca/circos/guide/tables/
        var chord = d3.layout.chord()
            .padding(.05)
            .sortSubgroups(d3.descending)
            .matrix(buildMatrixData());

        var width = $("#visualization").width(),
            height = $("#visualization").height(),
            innerRadius = Math.min(width, height) * .35,
            outerRadius = innerRadius * 1.11;

        var fill = d3.scale.ordinal()
            .domain(d3.range(machines.length))
            .range(buildMatrixColors());

        var svg = d3.select("#visualization")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        svg.append("g")
            .selectAll("path")
            .data(chord.groups)
            .enter().append("path")
            .style("fill", function(d) { return fill(d.index); })
            .style("stroke", function(d) { return fill(d.index); })
            .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
            .on("mouseover", fadeToOpacity(.1))
            .on("mouseout", fadeToOpacity(1));

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

        ticks.append("line")
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 5)
            .attr("y2", 0)
            .style("stroke", "#000");

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

        svg.append("g")
            .attr("class", "chord")
            .selectAll("path")
            .data(chord.chords)
            .enter().append("path")
            .style("fill", function(d) {return fill(d.target.index); })
            .style("stroke", "rgba(0, 0, 0, 0.1)")
            .attr("d", d3.svg.chord().radius(innerRadius))
            .style("opacity", 1);



        showVisualization();
    };

    this.update = function() {

    }
}
/**
 * Encapsulates the tree visualization to expose the 'redraw'/
 *
 * Given some retrieved JSON data of the node structure, displays the information
 *  in a graph using the D3 library. The data is to be structured so that the key
 *  "name" corresponds to a node's name, and the key "children" is an array of its
 *  children.
 *
 *  @param  structure     The structure of the tree
 *  @param  state         The state of the tree (node by node)
 */
function TreeVisualization(structure, state, mapReduce) {

    // layout
    var tree = d3.layout.tree();
    tree.sort(function(a,b) { return a.name > b.name ? 1 : -1; });

    // helper function for links
    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    var stateSize = Object.keys(state).length;


    // Selected data sets to use for color & size (respectively)
    var This = this;
    this.sizeDataSet = null;
    this.colorDataSet = null;
    this.setColorDataSet = function(dataSet) {
        This.colorDataSet = dataSet;
    };
    this.setSizeDataSet = function(dataSet) {
        This.sizeDataSet = dataSet;
    };

    // The data sets possible (same for both color & size)
    var colorDataSets = {}
    if (mapReduce) {
        colorDataSets = {
            mapReduce: 'by Map/Reduce',
            health : 'Job Health (%)',
            cpuUsage : 'Job CPU Usage (%)',
            memoryUsage : 'Job Memory Usage (%)',
            contextSwitchRate : 'Job Context Switch Rate (%)'
        };
    }
    else {
        colorDataSets = {
            health : 'Node Health (%)',
            cpuUsage : 'Node CPU Usage (%)',
            memoryUsage : 'Node Memory Usage (%)',
            contextSwitchRate : 'Node Context Switch Rate (%)'
        };
    }

    var sizeDataSets = {}
    if (mapReduce) {
        sizeDataSets = {
            work: "Time Remaining (%)",
            health : 'Job Health (%)',
            cpuUsage : 'Job CPU Usage (%)',
            memoryUsage : 'Job Memory Usage (%)',
            contextSwitchRate : 'Job Context Switch Rate (%)'
        };
    }
    else {
        sizeDataSets = {
            health : 'Node Health (%)',
            cpuUsage : 'Node CPU Usage (%)',
            memoryUsage : 'Node Memory Usage (%)',
            contextSwitchRate : 'Node Context Switch Rate (%)'
        };
    }

    /**
     * Returns the list of possible metrics on which to the node colors for this visualization
     */
    this.getColorDataSets = function() {
        return colorDataSets;
    };


    /**
     * Returns the list of possible metrics on which to the node sizes for this visualization
     */
    this.getSizeDataSets = function() {
        return sizeDataSets;
    };

    // set the structure of this visualization
    this.setStructure = function(newStructure) {
        structure = newStructure;
    };

    // set the state of this visualization
    this.setState = function(newState) {
        state = newState;
        stateSize = Object.keys(state).length;
    };


    /**
     * Helper function to interpolate linearly between red and green (to give a health color, or anything else between 0 and 1)
     */
    var interpolateUnitValueToColor = d3.scale.linear().domain([0, 1]).interpolate(d3.interpolateRgb).range(["rgb(255,0,0)", "rgb(0,255,0)"]);


    /**
     * Function called on a node to get its fill color
     * @param node  The node to fill with color
     */
    var fillColor = function(node) {

        if (node.hasOwnProperty('_children') && node['_children'] != null) {
            return "lightsteelblue";
        }
        if (node.hasOwnProperty('children')) {
            return 'white';
        } else {
            if (This.colorDataSet == "mapReduce") {
                if (node.name.indexOf("reduce") == -1) { //map task
                    return "blue"
                }
                else {
                    return "green";
                }
            }
            var value = (This.colorDataSet === 'health' ? state[node.name][This.colorDataSet] : (1-state[node.name][This.colorDataSet]));
            return interpolateUnitValueToColor(value);
        }
    };


    /**
     * Function to get a node's radius
     * @param node  The node whose radius to determine
     */
    var radius = function(node) {
        if (node.hasOwnProperty('children')) {
            return 15;
        } else {
            if (!state.hasOwnProperty(node.name)) {
                return 1;
            }
            if (This.sizeDataSet == "work") {
                var start = state[node.name]['start'];
                var duration = state[node.name]['duration'];
                var percentComplete = (currentTime - start)/duration;
                var value = 1 - percentComplete;
                return value * 15 + 5; // radius between 5 and 15
            }
            var value = (This.sizeDataSet === 'health' ? (1-state[node.name][This.sizeDataSet]) : state[node.name][This.sizeDataSet]);
            return value * 10 + 10; //radius between 10 and 20
        }
    };

    /**
     * Gives the title for this visualization
     */
    this.title = function() {
        if (mapReduce) {
            return "Topology Graph showing Map Reduce Jobs"
        }
        else {
            return "Topology Graph Showing Node Health";
        }
    };

    /**
     * Return the content to put in the 'legend' div
     */
    this.getLegendContent = function() {
        if (mapReduce && This.colorDataSet == "mapReduce") {
            return "<table>" +
                "<tr>" +
                    "<td>" +
                        "<svg style='width:10px; height:10px;'><circle fill='" + "blue" + "' cx=5 cy=5 r=5></svg>" +
                    "</td>" +
                    "<td style='padding-left:10px;'>Map Task</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "<svg style='width:10px; height:10px;'><circle fill='" + "green" + "' cx=5 cy=5 r=5></svg>" +
                    "</td>" +
                    "<td style='padding-left:10px;'>Reduce Task</td>" +
                "</tr>" +
                "</table>";
        }
        return "<table>" +
            "<tr>" +
                "<td>" +
                    "<svg style='width:10px; height:10px;'><circle fill='" + interpolateUnitValueToColor(1.0) + "' cx=5 cy=5 r=5></svg>" +
                "</td>" +
                "<td style='padding-left:10px;'>" + This.getColorDataSets()[This.colorDataSet] + " of 1.0</td>" +
            "</tr>" +
            "<tr>" +
                "<td>" +
                    "<svg style='width:10px; height:10px;'><circle fill='" + interpolateUnitValueToColor(0.0) + "' cx=5 cy=5 r=5></svg>" +
                "</td>" +
                "<td style='padding-left:10px;'>" + This.getColorDataSets()[This.colorDataSet] + " of 0.0</td>" +
            "</tr>" +
        "</table>"
    };

    /**
     * Construct the visualization for the first time
     */
    this.initialize = function() {
        var width = $("#visualization").width();
        var height = $("#visualization").height();

        // add main svg element
        var graph = d3.select("#visualization").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(0,40)");

        // stash positions for future use
        tree.nodes(structure).forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        redrawGraph(structure);
        showVisualization();
    };

    function updateToggling(source) {
        if (source.hasOwnProperty('children')) {
            for (var child in source['children']) {
                if (source['children'].hasOwnProperty(child)) {
                    updateToggling(source['children'][child]);
                }
            }
        }
        if (toggled.hasOwnProperty(source.name) && toggled[source.name]) {
            toggle(source);
        }
    }

    /**
     * Process the set of new log entries
     */
    this.update = function() {
        if (mapReduce) {
            structure = mapReduceStructure;
            state = mapReduceState;
            updateToggling(structure);
        }
        redrawGraph(structure);
    };


    /**
     * Redraws the graph so that it is up to date with it's associated data
     */
    var redrawGraph = function(source) {

        // duration of animations
        var duration = 200;

        //update width and height
        var width = $("#visualization").width();
        var height = $("#visualization").height();
        tree.size([width, height-100]);

        var graph = d3.select("#visualization").select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g");

        // fix node depths
        var nodes = tree.nodes(structure);
        nodes.forEach(function(d) {
            if (stateSize > 500) {
                d.y = d.depth * 120;
            }
            else {
                d.y = d.depth * 200;
            }
        });

        // update links
        var link = graph.selectAll("path")
            .data(tree.links(nodes), function(d) { return d.target.name; });

        // add new links, with animation starting from parent's old position
        var linkEnter = link.enter().insert("path", "g")
            .attr("class", "treeVisualizationLink");

        if (mapReduce) {
            linkEnter.attr("d", diagonal);
        }
        else {
            linkEnter.attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });
        }

        linkEnter.transition()
            .duration(duration)
            .attr("d", diagonal);

        // update current links
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        if (mapReduce) {
            link.exit().remove();
        }
        else {
            // remove old links, with animation to parent's new position
            link.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                })
                .remove();
        }

        // update nodes

        var node = graph.selectAll("g")
            .data(nodes, function(d) { return d.name; });
        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "treeVisualizationNode")
            .on("click", function(d) {
                if(d.hasOwnProperty('children')) {
                    toggle(d);
                    redrawGraph(d);
                } else if (!mapReduce) {
                    createNodeVisualization(d.name);
                }
            });

        if (mapReduce) {
            nodeEnter.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        }
        else {
            nodeEnter.attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; });
        }

        // add circles representing computers
        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", fillColor);

        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .text(function (d) {
                if (d.hasOwnProperty('children')) {
                    if (d.name.indexOf("rack") != -1 || d.name.indexOf("task") != -1) {
                        return d.name.substring(4);
                    }
                    else {
                        return "";
                    }
                }
                if (mapReduce) {
                    return d.name.substring(d.name.indexOf("Job") + "Job".length);
                }
                else {
                    return d.name.substring(7, d.name.length);
                }
            });

        // update existing nodes, with animation
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        // update circle radius and color
       // console.log(nodeUpdate.select("circle"));
        nodeUpdate.select("circle")
            .attr("r", radius)
            .style("fill", fillColor);

        if (mapReduce) {
            var nodeExit = node.exit().remove();
        }
        else {
            // remove old nodes, with animation to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
                .remove();
        }

        nodeExit.select("circle")
            .attr("r", 1e-6);

        // Stash old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    };

    var toggled = {};

    /**
     * Toggles whether the given node's children are visible or not
     * @param d the node
     */
    function toggle(d) {
        if (d.hasOwnProperty('children')) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
                toggled[d.name] = true;
            } else {
                d.children = d._children;
                d._children = null;
                toggled[d.name] = false;
            }
        }
    }
}
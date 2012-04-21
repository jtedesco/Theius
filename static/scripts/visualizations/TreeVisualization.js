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
function TreeVisualization(structure, state) {


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
            var health = state[node['name']]['health'];
            if (health > 0.7) {
                return 'green';
            } else if (health > 0.6) {
                return 'yellow';
            } else if (health > 0.3) {
                return 'orange';
            } else {
                return 'red';
            }
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
            var selected = $("#dataSetSelector option:selected").val();
            if (selected == "none") {
                return 20;
            }

            return (1-state[node.name][selected]) * 15 + 5; //radius between 5 and 20
        }
    };

    // layout
    var tree = d3.layout.tree();

    // helper function for links
    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    /**
     * Construct the visualization for the first time
     */
    this.initialize = function() {
        d3.select(".visualization").select("div").remove();
        d3.select(".visualization").select("svg").remove();
        var width = $(".visualization").width();
        var height = $(".visualization").height();

        // add main svg element
        var graph = d3.select(".visualization").append("svg")
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

    /**
     * Process the set of new log entries
     */
    this.update = function(logEvents) {
        redrawGraph(structure);
    };

    /**
     * Gives the title for this visualization
     */
    this.title = function() {
        return "Topology Graph Showing Node Health";
    };

    /**
     * Redraws the graph so that it is up to date with it's associated data
     */
    function redrawGraph(source) {

        // duration of animations
        var duration = 200;

        //update width and height
        var width = $(".visualization").width();
        var height = $(".visualization").height();
        tree.size([width, height-100]);

        var graph = d3.select(".visualization").select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g");

        // fix node depths
        var nodes = tree.nodes(structure);
        nodes.forEach(function(d) { d.y = d.depth * 200; });

        // update links
        var link = graph.selectAll("path")
            .data(tree.links(nodes), function(d) { return d.target.name; });

        // add new links, with animation starting from parent's old position
        link.enter().insert("path", "g")
            .attr("class", "treeVisualizationLink")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal);

        // update current links
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // remove old links, with animation to parent's new position
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // update nodes
        var node = graph.selectAll("g")
            .data(nodes, function(d) { return d.name; });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "treeVisualizationNode")
            .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
            .on("click", function(d) { toggle(d); redrawGraph(d); });

        // add circles representing computers
        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", fillColor);

        // update existing nodes, with animation
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        // update circle radius and color
        nodeUpdate.select("circle")
            .attr("r", radius)
            .style("fill", fillColor);

        // remove old nodes, with animation to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        // Stash old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    /**
     * Toggles whether the given node's children are visible or not
     * @param d the node
     */
    function toggle(d) {
        if (d.hasOwnProperty('children')) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        }
    }
}
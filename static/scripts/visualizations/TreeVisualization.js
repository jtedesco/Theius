/**
 * Encapsulates the tree visualization to expose the 'redraw'/
 *
 * Given some retrieved JSON data of the node structure, displays the information
 *  in a graph using the D3 library. The data is to be structured so that the key
 *  "name" corresponds to a node's name, and the key "children" is an array of its
 *  children.
 *
 *  @param  structure     The structure of the cluster
 *  @param  state         The state of the cluster (node by node)
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
            return 20;
        }
    };


    /**
     * Construct the visualization for the first time
     */
    var draw = function() {

        d3.select(".visualization").selectAll("svg").remove();
        d3.select(".visualization").selectAll("div").remove();
        var width = $(".visualization").width();
        var height = $(".visualization").height();

        var cluster = d3.layout.cluster()
            .size([width, height-100]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y]; });

        // get node and link locations from cluster library
        var nodes = cluster.nodes(structure);
        nodes.forEach(function(d) { d.y = d.depth * 180; });
        var links = cluster.links(nodes);

        // add main svg element
        var graph = d3.select(".visualization").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(0,40)");

        // add links
        var link = graph.selectAll("path.treeVisualizationLink")
            .data(links)
            .enter().append("path")
            .attr("class", "treeVisualizationLink")
            .attr("d", diagonal);

        // add nodes (just the container)
        var node = graph.selectAll("g.treeVisualizationNode")
            .data(nodes)
            .enter().append("g")
            .attr("class", "treeVisualizationNode")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("click", function(d) { toggle(d); draw();});

        // add circles representing nodes
        node.append("circle")
            .attr("r", radius)
            .attr("fill", fillColor);

        // automatically resize when the window changes
        window.onresize = function(event) {
            redrawGraph();
        };
    };

    this.initialize = draw;

    /**
     * Process the set of new log entries
     */
    this.update = function(logEvents) {
        redrawGraph();
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
    var redrawGraph = function() {

        draw();
        return;

        // get new width and height
        var width = $(".visualization").width();
        var height = $(".visualization").height();
       // console.log("width: " + width);
       // console.log("height: " + height);
        var cluster = d3.layout.cluster()
            .size([width, height-100]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y]; });

        // update width and height of graph
        var graph = d3.select(".visualization").select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g");


        var nodes = cluster.nodes(structure);
        nodes.forEach(function(d) { d.y = d.depth * 180; });
        console.log(nodes);

        var links = cluster.links(nodes);

        // update links
        var link = graph.selectAll("path.treeVisualizationLink")
            .data(links, function(d) {return d.target.id; });

        link.enter().append("path")
            .attr("class", "treeVisualizationLink")
            .attr("d", diagonal);

        link.attr("d", diagonal);

        link.exit()
            .remove();

        // update nodes (containers)
        var node = graph.selectAll("g.treeVisualizationNode")
            .data(nodes, function(d) { return d.id;});

        var nodeEnter = node.enter().append("g")
            .attr("class", "treeVisualizationNode")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("click", function(d) { toggle(d); update();});

        nodeEnter.append("circle")
            .attr("r", radius)
            .style("fill", fillColor);

        node.select("circle")
            .attr("r", radius)
            .style("fill", fillColor);

        var nodeExit = node.exit()
            .remove();
    };

    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }
}
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
        if (node.hasOwnProperty('children')) {
            return 'white';
        } else {
            return 'green';
        }
    };


    /**
     * Function to get a node's radius
     * @param node  The node whose radius to determine
     */
    var radius = function(node) {
        if (node.hasOwnProperty('children')) {
            return 5;
        } else {
            return 20;
        }
    };


    /**
     * Construct the visualization for the first time
     */
    d3.select("#graph").selectAll("svg").remove();
    var initialize = function() {

        var width = document.documentElement.clientWidth;
        var height = document.documentElement.clientHeight / 2;

        var cluster = d3.layout.cluster()
            .size([width, height-100]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y]; });

        // get node and link locations from cluster library
        var nodes = cluster.nodes(structure);
        var links = cluster.links(nodes);

        // add main svg element
        var graph = d3.select("#graph").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(0,40)");

        // add links
        var link = graph.selectAll("path.link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        // add nodes (just the container)
        var node = graph.selectAll("g.node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        // add circles representing nodes
        node.append("circle")
            .attr("r", radius)
            .attr("fillColor", fillColor);

        // automatically resize when the window changes
        window.onresize = function(event) {
            redrawGraph();
        };
    }();


    /**
     * Process the set of new log entries
     */
    this.update = function(logEvents) {
        redrawGraph();
    };


    /**
     * Redraws the graph so that it is up to date with it's associated data
     */
    var redrawGraph = function() {

        // get new width and height
        var width = document.documentElement.clientWidth;
        var height = document.documentElement.clientHeight / 2;

        var cluster = d3.layout.cluster()
            .size([width, height-100]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y]; });

        var nodes = cluster.nodes(structure);
        var links = cluster.links(nodes);

        // update width and height of graph
        var graph = d3.select("#graph").select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g");

        // update links
        var link = graph.selectAll("path.link")
            .data(links)
            .attr("d", diagonal);

        // update nodes (containers)
        var node = graph.selectAll("g.node")
            .data(nodes)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        // update circles representing nodes
        node.select("circle")
            .transition(2000)
            .attr("r", radius)
            .attr("fillColor", fillColor);
    };
}
/**
* Encapsulates the treeMap visualization to expose the 'redraw'/
    *
* Given some retrieved JSON data of the node structure, displays the information
    *  in a treeMap using the D3 library. The data is to be structured so that the key
*  "name" corresponds to a node's name, and the key "children" is an array of its
    *  children.
    *
*  @param  structure     The structure of the cluster
*  @param  state         The state of the cluster (node by node)
*/
function TreeMapVisualization(structure, state) {

    var color = d3.scale.category20c();

    var background = function (d) {
        return d.children ? color(d.name) : null;

        /*if (d.children)
            return d.children;

        if (d){
            var health = state[d['name']]['health'];
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

        return "lightblue";*/
    };

    var value = function (d) {
        var selected = $("#dataSetSelector option:selected").val();
        if (selected == "none") {
            return 5;
        }

        return state[d.name][selected];
    }

    /**
     * Gives the title for this visualization
     */
    this.title = function() {
        return "Tree Map Showing Node Health";
    };

    /**
     * Function that styles the cell i.e. each box in the treeMap
     */
    function cell() {

        this.style("left", function (d) {
            return d.x + "px";
        })
            .style("top", function (d) {
                return d.y + "px";
            })
            .style("width", function (d) {
                return Math.max(0, d.dx - 1) + "px";
            })
            .style("height", function (d) {
                return Math.max(0, d.dy - 1) + "px";
            });
    }

    var treemap = d3.layout.treemap()
        .value(value);

    /**
     * Updates the graph so that it is up to date with it's associated data
     */
    function redraw(data) {
        var width = $(".visualization").width();
        var height = $(".visualization").height();

        treemap.size([width, height])
            .sticky(true);

        var div = d3.select(".visualization").select("div")
            .style("width", width + "px")
            .style("height", height + "px");

        div.data([structure]).selectAll("div")
            .data(treemap.nodes, function(d) { return d.name;})
            .enter().append("div")
            .attr("class", "cell")
            .call(cell)
            .attr("id", function(node) {
                return node.name;
            })
            .text(function (d) {
                return d.name;
            });

        d3.select(".visualization").select("div").selectAll("div")
            .data(treemap.nodes, function(d) { return d.name;})
            .style("background", background)
            .transition()
            .duration(300)
            .call(cell);
    }

    this.update = redraw;

    /**
     * Construct the visualization for the first time
     */
    this.initialize = function() {

        var width = $(".visualization").width();
        var height = $(".visualization").height();

        treemap.size([width, height])
            .sticky(true);

        d3.select(".visualization").select("div").remove();

        var div = d3.select(".visualization").append("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px");

        redraw([]);
        showVisualization();
    }
}
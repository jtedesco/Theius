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


        this
            .style("left", function (d) {

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

    /**
     * Updates the graph so that it is up to date with it's associated data
     */
    this.update = function(data) {


        var width = $(".visualization").width();
        var height = $(".visualization").height();
        color = d3.scale.category20c();

        var treemap = d3.layout.treemap()
            .size([width, height])
            .sticky(true)
            .value(
            function (d) {
              //  console.log("value: " + d.value);
               // if (d.value)
               //     return d.value;
                return 5;
            });


        var map = d3.select(".visualization").select("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px");

        map.selectAll("div")
            .data(treemap.nodes)
            .style("background",
            function (d) {
                if (d.children)
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

                return "lightblue";
            })
            .transition()
            .duration(1500)
            .call(cell);
    }

    /**
     * Construct the visualization for the first time
     */
    this.initialize = function() {

        var width = 868;//HardCoded for now.Bug need to fix later.$(".visualization").width();
        var height = $(".visualization").height();
        color = d3.scale.category20c();

        var treemap = d3.layout.treemap()
            .size([width, height])
            .sticky(true)
            .value(function (d) {
                return 5;
            });

        d3.select(".visualization").select("div").remove();

        var div = d3.select(".visualization").append("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px");

        div.data([structure]).selectAll("div")
            .data(treemap.nodes)
            .enter().append("div")
            .attr("class", "cell")
            .style("background", function (d) {
                return d.children ? d.color : null;
            })
            .call(cell)
            .text(function (d) {
                return d.name;
            });

    }
}


/*
 var width = 960,
 2     height = 500,
 3     color = d3.scale.category20c();
 4
 5 var treemap = d3.layout.treemap()
 6     .size([width, height])
 7     .sticky(true)
 8     .value(function(d) { return d.size; });
 9
 10 var div = d3.select("#chart").append("div")
 11     .style("position", "relative")
 12     .style("width", width + "px")
 13     .style("height", height + "px");
 14
 15 d3.json("../data/flare.json", function(json) {
 16   div.data([json]).selectAll("div")
 17       .data(treemap.nodes)
 18     .enter().append("div")
 19       .attr("class", "cell")
 20       .style("background", function(d) { return d.children ? color(d.name) : null; })
 21       .call(cell)
 22       .text(function(d) { return d.children ? null : d.name; });
 23
 24   d3.select("#size").on("click", function() {
 25     div.selectAll("div")
 26         .data(treemap.value(function(d) { return d.size; }))
 27       .transition()
 28         .duration(1500)
 29         .call(cell);
 30
 31     d3.select("#size").classed("active", true);
 32     d3.select("#count").classed("active", false);
 33   });
 34
 35   d3.select("#count").on("click", function() {
 36     div.selectAll("div")
 37         .data(treemap.value(function(d) { return 1; }))
 38       .transition()
 39         .duration(1500)
 40         .call(cell);
 41
 42     d3.select("#size").classed("active", false);
 43     d3.select("#count").classed("active", true);
 44   });
 45 });
 46
 47 function cell() {
 48   this
 49       .style("left", function(d) { return d.x + "px"; })
 50       .style("top", function(d) { return d.y + "px"; })
 51       .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
 52       .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
 53 }
 */
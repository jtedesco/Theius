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

    var color = d3.scale.category20();


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


    /**
     * Returns the list of possible metrics on which to the node colors for this visualization
     */
    this.getColorDataSets = function() {
        return {
            rack : 'By Rack',
            health : 'Node Health (%)',
            cpuUsage : 'Node CPU Usage (%)',
            memoryUsage : 'Node Memory Usage (%)',
            contextSwitchRate : 'Node Context Switch Rate (%)'
        };
    };


    /**
     * Returns the list of possible metrics on which to the node sizes for this visualization
     */
    this.getSizeDataSets = function() {
        return {
            health : 'Node Health (%)',
            cpuUsage : 'Node CPU Usage (%)',
            memoryUsage : 'Node Memory Usage (%)',
            contextSwitchRate : 'Node Context Switch Rate (%)'
        };
    };


    /**
     * Helper function to interpolate linearly between red and green (to give a health color, or anything else between 0 and 1)
     */
    var interpolateUnitValueToColor = d3.scale.linear().domain([0, 1]).interpolate(d3.interpolateRgb).range(["rgb(255,0,0)", "rgb(0,255,0)"]);


    /**
     * Colors the rectangle
     */
    var background = function (node) {
        if(!node.children) {
            if(This.colorDataSet === 'rack') {
                return color(state[node.name][This.colorDataSet]);
            } else {
                var value = This.colorDataSet === 'health' ? state[node.name][This.colorDataSet] : (1-state[node.name][This.colorDataSet]);
                return interpolateUnitValueToColor(value);
            }
        } else {
            return 'white';
        }
    };

    var value = function (node) {
        return state[node.name][This.sizeDataSet];
    };

    // Build the list of rack names
    var racks = buildRacksData();

    /**
     * Return the content to put in the 'legend' div
     */
    this.getLegendContent = function() {
        if(This.colorDataSet === 'rack') {

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
        } else {
            return "<table>" +
                "<tr>" +
                    "<td>" +
                        "<div style='width:10px; height:10px; background-image: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color:" + interpolateUnitValueToColor(1.0) + "'></div>" +                    "</td>" +
                    "<td style='padding-left:10px;'>" + This.getColorDataSets()[This.colorDataSet] + " of 1.0</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "<div style='width:10px; height:10px; background-image: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color:" + interpolateUnitValueToColor(0.0) + "'></div>" +
                    "</td>" +
                    "<td style='padding-left:10px;'>" + This.getColorDataSets()[This.colorDataSet] + " of 0.0</td>" +
                "</tr>" +
            "</table>"
        }
    };



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
        var width = $("#visualization").width();
        var height = $("#visualization").height();

        treemap.size([width, height])
            .sticky(true);

        var div = d3.select("#visualization").select("div")
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
                return d.children ? '' : d.name;
            })
            .on('click', function (d) {
                return d.children ? null : showNodeVisualization(d.name);
            });


        d3.select("#visualization").select("div").selectAll("div")
            .data(treemap.nodes, function(d) { return d.name;})
            .style("background", background)
            .transition()
            .call(cell);
    }

    this.update = redraw;

    /**
     * Construct the visualization for the first time
     */
    this.initialize = function() {

        var width = $("#visualization").width();
        var height = $("#visualization").height();

        treemap.size([width, height])
            .sticky(true);

        d3.select("#visualization").select("div").remove();

        var div = d3.select("#visualization").append("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px");

        redraw([]);
        showVisualization();
    }
}

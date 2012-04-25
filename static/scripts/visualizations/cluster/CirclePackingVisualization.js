/**
 * Encapsulates the circlePacking visualization to expose the 'redraw'/
 *
 * Given some retrieved JSON data of the node structure, displays the information
 *  in a treeMap using the D3 library. The data is to be structured so that the key
 *  "name" corresponds to a node's name, and the key "children" is an array of its
 *  children.
 *
 *  @param  structure     The structure of the cluster
 *  @param  state         The state of the cluster (node by node)
 */

function CirclePackingVisualization(structure, state) {


    var This = this;
    var format = d3.format(",d"); // need this?
    var color = d3.scale.category20();

    // Selected data sets to use for color & size (respectively)
    this.sizeDataSet = null;
    this.colorDataSet = null;
    this.setColorDataSet = function(dataSet) {
        This.colorDataSet = dataSet;
    };
    this.setSizeDataSet = function(dataSet) {
        This.sizeDataSet = dataSet;
    };


    var radius = function(node) {
        if (node.hasOwnProperty('children')) {
            node.value = node.r;
        } else {
            node.value = (This.sizeDataSet === 'health' ? (1-state[node.name][This.sizeDataSet]) : state[node.name][This.sizeDataSet]);
            //return ((value * 15) + 5); //radius between 5 and 20
        }
    }; //radius function for tree, maybe useful*/

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
     * Colors the circles
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
            return 'lightblue';
        }
    };


    var value = function (node) {
        if(state[node.name][This.sizeDataSet]==0)
            return 0.05 ;
        else
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

    this.title = function () {
        return "Circle Packing Showing Node Health";
    };



    var pack = d3.layout.pack()
        .value(value);


    /**
     * Updates the graph so that it is up to date with it's associated data
     */
    function redraw() {
        //console.log(value);
        var duration = 200;
        var width = $("#visualization").width();
        var height = $("#visualization").height();
        pack.size([width - 4, height - 4]);

        var vis = d3.select("#visualization").select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g");

        var node = vis.selectAll("g")
            .data(pack.nodes(structure), function(d) { return d.name;});

        //input node first time
        var nodeInput = node.enter().append("g")
            .attr("class", function (d) {
                return d.children ? "node" : "leaf node";
            })
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .on('click', function (d) {
                return d.children ? null : createNodeVisualization(d.name);
            });

        nodeInput.append("circle")
            .style("fill", background)
            .attr("r", function (d) {
                return d.r ;
            });

        nodeInput.filter(
            function (d) {
                return !d.children;
            }).append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .text(function (d) {
                return d.name.substring(7, d.name.length);
            });

        //updating node
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        nodeUpdate.select("circle")

            .attr("r", function (d) {
               // console.log(d);
                return d.r ;
            })
            .style("fill", background);

    }

    this.update = redraw;

    this.initialize = function () {

        d3.select("#visualization").select("div").remove();
        d3.select("#visualization").select("svg").remove();

        var width = $("#visualization").width();
        var height = $("#visualization").height();


        pack.size([width - 4, height - 4]);


        var vis = d3.select("#visualization").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "pack")
            .append("g")
            .attr("transform", "translate(2, 2)");

        redraw();
        showVisualization();


    }
}
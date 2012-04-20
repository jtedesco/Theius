function TreeVisualization(structure, state) {

    function updateGraphData(obj, node) {
        if (node == undefined) return;
        if (obj.name == node.name) {
            for (var key in obj) {
                node[key] = obj[key];
            }
            return;
        } else {
            for (var i in node.children) {
                updateGraphData(obj, node.children[i]);
            }
        }
    }

    function redrawMap(data) {

        var dataChange = $.parseJSON(data['updates']);
        for (var i in dataChange) {
            updateGraphData(dataChange[i], window.graphData);
        }
        console.log(dataChange);
        console.log(window.graphData);
        var width = document.documentElement.clientWidth - 100,
            height = document.documentElement.clientHeight - 100;
        color = d3.scale.category20c();

        var treemap = d3.layout.treemap()
            .size([width, height])
            .sticky(true)
            .value(
            function (d) {
                if (d.value) return d.value;
                return 5;
            });


        var map = d3.select("#chart").select("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px");

        map.selectAll("div")
            .data(treemap.nodes)
            .style("background",
            function (d) {
                if (d.children)
                    return d.children;
                if (d.color)
                    return d.color;
                return "lightblue";
            })
            .transition()
            .duration(1500)
            .call(cell);

        /*
         var node = map.data([window.graphData]).selectAll("div")
         .data(treemap.nodes)
         .enter().select("div")
         .attr("class","cell")
         .style("background", function(d) { return d.children ? color(d.name) : null; })
         .call(cell)
         .text(function(d){return d.name;});
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

    }

    function initMap(data) {

        window.graphData = data;
        console.log(data);
        var width = document.documentElement.clientWidth - 100,
            height = document.documentElement.clientHeight - 100;
        color = d3.scale.category20c();

        var treemap = d3.layout.treemap()
            .size([width, height])
            .sticky(true)
            .value(function (d) {
                return 5;
            });

        var div = d3.select("#chart").append("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px");

        div.data([window.graphData]).selectAll("div")
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
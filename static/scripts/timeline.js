/**
 * Created by PyCharm.
 * User: Roman
 * Date: 4/30/12
 * Time: 1:20 AM
 * To change this template use File | Settings | File Templates.
 */

function showTimeline() {
    var dataSet = $("#sizeDataSetSelector option:selected").val();
    $("#timelineDiv").fadeIn();
    var history = deepCopy(clusterStateHistory);
    var data = getData(clusterStateHistory, dataSet);
    drawTimeline(data, history, dataSet);
}

function hideTimeline() {
    $("#timelineDiv").fadeOut();
    visualization.setState(clusterState);
    visualization.update();
}

function getData(history, dataSet) {
    var data = [];
    for (var i in history) {
        if (history.hasOwnProperty(i)) {
            var point = history[i],
                result = 0,
                count = 0;

            for (var j in point) {
                if (point.hasOwnProperty(j)) {
                    var node = point[j];
                    var datum = node[dataSet];
                    result += datum;
                    count += 1;
                }
            }

            data.push(result / count);
        }
    }
    //data.push(0);
    return data;
}

function drawTimeline(data, history, dataSet) {

    var width = $("#timeline").width();
    var height = $("#timeline").height();

    var m = [30, 20, 20, 60],
        w = width - m[1] - m[3],
        h = height - m[0] - m[2];

    var x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([h, 0]),
        xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(-h, 0).tickPadding(6),
        yAxis = d3.svg.axis().scale(y).orient("right").tickSize(-w).tickPadding(6);

    var area = d3.svg.area()
        .interpolate("step-after")
        .x(function(d, i) { return x(i); })
        .y0(y(0))
        .y1(function(d) { return y(d); });

    var line = d3.svg.line()
        .interpolate("step-after")
        .x(function(d, i) { return x(i); })
        .y(function(d) { return y(d); });

    $("#timeline").children().remove();

    var svg = d3.select("#timeline").append("svg:svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .append("svg:g")
        .attr("transform", "translate(20, 20)" );

    svg.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + w + ",0)");

    svg.append("svg:path")
        .attr("class", "area");

    svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")");

    svg.append("svg:g")
        .attr("transform", "translate(" + w/2 + ", " + (h + m[0]) +  ")")
        .append("text")
        .text("Time");

    svg.append("svg:g")
        .attr("transform", "translate(" + (w + m[1] + 25) + ", " + (h/2 + dataSet.length*2) + ") rotate(270,0,0)")
        .append("text")
        .text(dataSet);

    svg.append("svg:path")
        .attr("class", "line");

    svg.append("svg:rect")
        .attr("class", "pane")
        .attr("width", w)
        .attr("height", h);

    x.domain([0, data.length-1]);
    y.domain([d3.min(data) - 0.05, d3.max(data) + 0.05]);

    // bind data
    svg.select("path.area").data([data]);
    svg.select("path.line").data([data]);

    // draw
    svg.select("g.x.axis").call(xAxis);
    svg.select("g.y.axis").call(yAxis);
    svg.select("path.area").attr("d", area);
    svg.select("path.line").attr("d", line);

    // add brush
    var brush = d3.svg.brush();
    brush.x(x);
    brush.y(y);
    brush.extent([[data.length-2,0],[data.length-1,1]]);
    svg.append("g").attr("class", "brush").call(brush);
    $(".resize").hide();
    $(".background").hide();

    brush.on("brushstart", onBrushStart)
        .on("brush", onBrush)
        .on("brushend", onBrushEnd);

    function onBrushStart(p) {
        $(".resize").hide();
        $(".background").hide();
    }

    function onBrush(p) {
        var brushLocation = brush.extent();
        updateDataSets(Math.round(brushLocation[0][0] + 0.5));
    }

    function onBrushEnd() {
        $(".resize").hide();
        $(".background").hide();
    }

    function updateDataSets(index) {
        visualization.setState(history[index]);
        visualization.update();
    }
}


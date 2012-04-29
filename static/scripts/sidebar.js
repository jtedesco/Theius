/**
 * Created by PyCharm.
 * User: Roman
 * Date: 4/21/12
 * Time: 6:54 PM
 * To change this template use File | Settings | File Templates.
 */

/**
 * Updates the right side bar
 */
function updateRightSideBar() {
    // the current active tab
    var tab = $("#rightSidebar div.tab-content div.active").attr('id');

    if (tab === "rankings") {
        updateRankings(clusterState);
    }
    else if (tab === "events") {
        updateEvents(clusterLogs);
    }
    else if (tab === "general") {
        updateGeneralTab(clusterState, clusterLogs);
    }
}

/**
 * Updates Rankings tab in right sidebar
 * @param state the current state of all nodes
 */
function updateRankings(state) {
    // selected options
    var key = $("#rankings-data li.active").attr("name");
    var ascending = $("#rankings-order li.active").text() === "Ascending";

    // put state into array first, and sort
    var stateArray = [];
    for (var i in state) {
        if (state.hasOwnProperty(i) && i.search("machine") != -1) {
            stateArray.push(state[i]);
        }
    }
    stateArray.sort(function(a,b) {
        if (a[key] === b[key]) {
            return a.name < b.name ? -1 : 1;
        }
        else if (ascending) {
            return a[key] - b[key];
        }
        else {
            return b[key] - a[key];
        }
    });

    //only take first 10 sorted elements
    stateArray = stateArray.slice(0,10);

    //helper functions for D3
    var text = function(d) { return d.name + ": " + (d[key] * 100).toFixed(0) + "%"};
    var linkedTitle = function(d) { return "<a href='javascript:createNodeVisualization(\"" + d.name + "\")'>Node '" + d.name + "'</a>";};
    var probabilitiesData = function(d) {
        return "<h4>Probabilities of Events:</h4><br/>" +
            "<div style='margin-left:10px;'>" +
                "FATAL: " + d.predictedSeverityProbabilities.FATAL.toFixed(2) + "<br/>" +
                "ERROR: " + d.predictedSeverityProbabilities.ERROR.toFixed(2) + "<br/>" +
                "WARN: " + d.predictedSeverityProbabilities.WARN.toFixed(2) + "<br/>" +
                "INFO: " + d.predictedSeverityProbabilities.INFO.toFixed(2) + "<br/>" +
            "</div><br/>";
    };
    var predictedFailureTime = function(d) { return "<b>Predicted Failure:</b><br/><br/>&nbsp;&nbsp;&nbsp;" + d.predictedFailureTime + "<br/><br/>"; };
    var lastFailureTime = function(d) { return "<b>Last Failure:</b><br/><br/>&nbsp;&nbsp;&nbsp;" + d.lastFailureTime; };

    $('#rankingsData').children().remove();

    // update svg width + height, and bind data to the elements
    var rankings = d3.select("#rankingsData")
        .selectAll("div.nodeWrapper")
        .data(stateArray, function(node) { return node.name; })
        .order();

    // add new nodes
    var rankingsEnter = rankings.enter().insert("div", "div.nodeWrapper");

    rankingsEnter
        .style("height", "0px")
        .attr("class", "nodeWrapper")
        .style("opacity", 0);

    rankingsEnter
        .append("a")
        .attr("class" , "sidebarText")
        .style("font-size", "0px")
        .attr("data-toggle", "collapse")
        .attr("href", function(d) { return "#nodeWrapper" + d.name;})
        .text(text);

    var collapse = rankingsEnter.append("div")
        .attr("id", function(node) { return "nodeWrapper" + node.name; })
        .attr("class", "collapse")
        .append("div")
        .attr("class", "well");

    // Add the title & node popover content
    collapse.append("h4").html(linkedTitle);
    collapse.append("br");
    collapse.append("div").html(probabilitiesData);
    collapse.append("div").html(predictedFailureTime);
    collapse.append("div").html(lastFailureTime);

    rankingsEnter.transition()
        .duration(0)
        .style("height", "auto")
        .style("opacity", 1.0)
        .select("a")
        .style("font-size", "16px");

    // exiting nodes slide to the bottom and fade off screen
    var rankingsExit = rankings.exit()
        .transition()
        .duration(0)
        .style("height", "0px")
        .style("opacity", 0);

    rankingsExit.select("p")
        .style("font-size", "0px");

    rankingsExit.remove();
}

/**
 * Updates Events Tab in right sidebar
 * @param logs all logs in the cluster
 */
function updateEvents(logs) {
    // grab last ten logs
    var lastLogs = logs.slice(-20).reverse();

    var header = function(d) { return d.timestamp + " " + d.severity };
    var h1 = function(d) { return "Log #" + d.id; };
    var div1 = function(d) { return "Facility : " + d.facility; };
    var div2 = function(d) { return "Location : " + d.location; };
    var div3 = function(d) {
        if (d.message.length > 15) {
            return "Message  : " + d.message.substring(0,15) + "...";
        }
        else {
            return "Message  : " + d.message;
        }
    };

    var events = d3.select("#events").selectAll("div.logWrapper")
        .data(lastLogs, function(d) { return d.id; })
        .order();

    var eventsEnter = events.enter().insert("div", "div.logWrapper");

    eventsEnter
        .style("height", "0px")
        .attr("class", "logWrapper")
        .style("opacity", 0);

    eventsEnter.append("a")
        .attr("class", "sidebarText")
        .style("font-size", "0px")
        .attr("data-toggle", "collapse")
        .attr("href", function(d) { return "#log" + d.id; })
        .text(header);

    var collapse = eventsEnter.append("div")
        .attr("id", function(d) { return "log" + d.id; })
        .attr("class", "collapse")
        .append("div")
        .attr("class", "well");

    collapse.append("h4").text(h1);
    collapse.append("br");
    collapse.append("div").text(div1);
    collapse.append("div").text(div2);
    collapse.append("div").text(div3);

    eventsEnter.transition()
        .duration(500)
        .style("height", "auto")
        .style("opacity", 1.0)
        .select("a")
        .style("font-size", "16px");

    var eventsExit = events.exit()
        .transition()
        .duration(500)
        .style("height", "0px")
        .style("opacity", 0);

    eventsExit.select("p")
        .style("font-size", "0px");

    eventsExit.remove();
}

/**
 * Updates the General Tab in the right sidebar
 * @param state the current state of all nodes
 * @param logs all logs in the cluster
 */
function updateGeneralTab(state, logs) {
    var avgHealth = 0,
        worstHealth = 1.0,
        bestHealth = 0.0,
        cpu = 0,
        memory = 0;

    // needed to compute averages
    var count = 0;

    for (var key in state){
        if (state.hasOwnProperty(key)) {
            var node = state[key];
            avgHealth += node.health;
            worstHealth = Math.min(worstHealth, node.health);
            bestHealth = Math.max(bestHealth, node.health);
            cpu += node.cpuUsage;
            memory += node.memoryUsage;
            count += 1;
        }
    }

    avgHealth /= count;
    cpu /= count;
    memory /= count;

    // Tally the total logs associated with all nodes
    var logsCollected = 0;
    for(var name in clusterState) {
        if(clusterState.hasOwnProperty(name)) {
            logsCollected += clusterState[name].events.length;
        }
    }


    $("#general-avg-health").text((avgHealth * 100).toFixed(2));
    $("#general-worst-health").text((worstHealth * 100).toFixed(0));
    $("#general-best-health").text((bestHealth * 100).toFixed(0));
    $("#general-cpu").text((cpu * 100).toFixed(2));
    $("#general-memory").text((memory * 100).toFixed(2));
    $("#general-total-logs").text(logsCollected);
}
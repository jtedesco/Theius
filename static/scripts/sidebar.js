/**
 * Created by PyCharm.
 * User: Roman
 * Date: 4/21/12
 * Time: 6:54 PM
 * To change this template use File | Settings | File Templates.
 */

/**
 * Updates the right side bar
 * @param state the current state of all nodes
 */
function updateRightSideBar(state) {
    // the current active tab
    var tab = $("#rightSidebar div.tab-content div.active").attr('id');

    // put state into array first, and sort
    var stateArray = [];
    for (var key in state) {
        if (state.hasOwnProperty(key) && key.search("machine") != -1) {
            stateArray.push(state[key]);
        }
    }
    stateArray.sort(function(a,b) {
        return a['health'] - b['health'];
    });

    //only take first 10 sorted elements
    stateArray = stateArray.slice(0,10);

    //helper functions for D3
    var text = function(d) { return d.name + ": " + d.health.toFixed(2)};
    var height = function(i) { return i*25 + 20};
    var position = function(x) { return function(d,i) { return "translate(" + x + "," + height(i) + ")"; }};

    // update svg width + height, and bind data to the elements
    var health = d3.select("#health").select("svg")
        .attr("width", $('#health').width())
        .attr("height", 600)
        .selectAll("g")
        .data(stateArray, function(d) {return d.name;})
        .order();

    // add new nodes, which should slide in from the left
    var healthEnter = health.enter().append("g")
        .attr("transform", position(-100))
        .style("opacity", 1.0);

    healthEnter.append("text")
        .attr("class" , "sidebarText")
        .text(text);

    healthEnter.transition()
        .duration(500)
        .attr("transform", position(0));

    // update current nodes, which slide to their new position
    health.transition()
        .duration(500)
        .attr("transform", position(0))
        .select("text")
        .text(text);

    // exiting nodes slide to the bottom and fade off screen
    health.exit()
        .transition()
        .duration(500)
        .attr("transform", function(d,i) { return "translate(0," + height(10) + ")"; })
        .style("opacity", 0)
        .remove();
}
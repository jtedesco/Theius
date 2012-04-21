/**
 * Smoothly transitions to a new visualization
 *
 * @param newVisualization  The new visualization object, attached to the page data
 * @param liId              The id of the nav element to mark as active
 */
function changeVisualization(newVisualization, liId) {

    // Update the active entry in the nav bar
    $('.navbar li').removeClass('active');
    $('#' + liId).addClass('active');

    // Remove the current content of the visualization
    $('.visualization').find('svg').remove();
    $('.visualization').hide();
    $('#visualizationTitle').hide();
    $('#visualizationWrapper .hero-unit').remove();

    // Show a loading message temporarily
    $('#visualizationWrapper').prepend($('<div id="loadingMessage" class="hero-unit"><h3>Loading...</h3><br/><p>Please be patient</p></div>'));

    // Update the visualization variable
    visualization = newVisualization;
    if(visualization != null) {
        visualization.initialize();
        visualization.update([]);

        // Show the title for the visualization
        var visualizationTitle = $('#visualizationTitle');
        visualizationTitle.html("<h3>" + visualization.title() + "</h3>");
        visualizationTitle.show();

        // Attach mouse over listeners
        attachPopovers();

    } else {
        $('#visualizationWrapper').prepend($('<div id="errorMessage" class="hero-unit"><h3>Error loading visualization</h3><br/><p>Please try again</p></div>'));
    }

    // Find the loading message
    $('#loadingMessage').remove();
}

// Show the visualization if it was successfully loaded
function showVisualization() {
    $('.visualization').fadeIn('fast');
}

/**
 * Generates the popover content for a node
 *  @param node The node for which to generate the popover data
 */
function generateNodeContent(node) {

    function formatNum(num) {
        return num.toFixed(2);
    }

    return "<table>" +
        "<tr><td style='width:220px;'><b>CPU Usage:&nbsp;&nbsp;</b></td><td style='width:90px;>" + formatNum(node['cpuUsage']) + "</td></tr>" +
        "<tr><td><b>Memory Usage:&nbsp;&nbsp;</b></td><td>" + formatNum(node['memoryUsage']) + "</td></tr>" +
        "<tr><td><b>Context Switch Rate:&nbsp;&nbsp;</b></td><td>" + formatNum(node['contextSwitchRate']) + "</td></tr>" +
        "<tr><td><b>Last Failure Time:&nbsp;&nbsp;</b></td><td'>" + node['lastFailureTime'] + "</td></tr>" +
        "<tr><td><b>Predicted Failure Time:&nbsp;&nbsp;</b></td><td>" + node['predictedFailureTime'] + "</td></tr>" +
        "<tr><td><b>Prob of FATAL Event:&nbsp;&nbsp;</b></td><td>" + formatNum(node['predictedSeverityProbabilities']['FATAL']) + "</td></tr>" +
        "<tr><td><b>Prob of ERROR Event:&nbsp;&nbsp;</b></td><td>" + formatNum(node['predictedSeverityProbabilities']['ERROR']) + "</td></tr>" +
        "<tr><td><b>Prob of WARN Event:&nbsp;&nbsp;</b></td><td>" + formatNum(node['predictedSeverityProbabilities']['WARN']) + "</td></tr>" +
        "<tr><td><b>Prob of INFO Event:&nbsp;&nbsp;</b></td><td>" + formatNum(node['predictedSeverityProbabilities']['INFO']) + "</td></tr>" +
        "<tr><td><b>Estimated Health:&nbsp;&nbsp;</b></td><td>" + formatNum(node['health']) + "</td></tr>" +
        "</table>";
}


/**
 * Attach popovers for all nodes
 */
function attachPopovers() {
    for(var nodeName in clusterState) {
        if(clusterState.hasOwnProperty(nodeName)) {

            var nodeElement = $('#' + nodeName);
            nodeElement.attr('data-original-title', '<i>' + nodeName + '</i> information');
            nodeElement.attr('data-content', function() {

                var node = clusterState[nodeName];
                return generateNodeContent(node);
            });
            nodeElement.popover({ delay: {
                show: 100,
                hide: 100
            }});
        }
    }
}

/**
 * Update the information in the node popup, given the updated state
 *  @param stateChange  The state that has changed from the update
 */
function updateNodePopovers(stateChange) {
    for(var nodeName in stateChange) {
        if(stateChange.hasOwnProperty(nodeName)) {
            $('.popover-content').html(generateNodeContent(clusterState[nodeName]));
        }
    }
}
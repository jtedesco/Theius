var initialized = false;

/**
 * Initialize the data sets by populating the option menu & setting the data sets on the visualizations
 */
function initializeDataSets() {

    // Attach change listeners to the option menus if we haven't done so
    if (!initialized) {
        $("#colorDataSetSelector").change(function () {
            chooseColorDataSet($("#colorDataSetSelector option:selected").val());
        });
        $("#sizeDataSetSelector").change(function () {
            chooseSizeDataSet($("#sizeDataSetSelector option:selected").val());
        });
        $("select").removeAttr('disabled');
        initialized = true;
    }

    // Populate the menus
    var colorDataSets = visualization.getColorDataSets();
    var sizeDataSets = visualization.getSizeDataSets();
    populateDataSetMenu($("#colorDataSetSelector"), colorDataSets);
    populateDataSetMenu($("#sizeDataSetSelector"), sizeDataSets);

    // Choose the first entries for data sets
    var i;
    for (i in colorDataSets) {
        if (colorDataSets.hasOwnProperty(i)) {
            chooseColorDataSet(i);
            break;
        }
    }
    for (i in sizeDataSets) {
        if (sizeDataSets.hasOwnProperty(i)) {
            chooseSizeDataSet(i);
            break;
        }
    }
}


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
    $('#visualization').children().remove();
    coverVisualization();
    $('#visualizationTitle').hide();
    $('#visualizationWrapper .hero-unit').remove();

    // Show a loading message temporarily
    $('#visualizationWrapper').prepend($('<div id="loadingMessage" class="hero-unit"><h3>Loading...</h3><br/><p>Please be patient</p></div>'));

    // Hide the node visualization window if it's up
    hideNodeVisualization();

    // Update the visualization variable
    visualization = newVisualization;
    if(visualization != null) {
        initializeDataSets();
        // Initialize the visualization it self
        visualization.initialize();

        // Show the title for the visualization
        var visualizationTitle = $('#visualizationTitle');
        visualizationTitle.html("<h3>" + visualization.title() + "</h3>");
        visualizationTitle.show();

        // Show the legend for the visualization
        $('#legend').html(visualization.getLegendContent());

        // Attach mouse over listeners
        attachPopovers();


    } else {
        $('#visualizationWrapper').prepend($('<div id="errorMessage" class="hero-unit"><h3>Error loading visualization</h3><br/><p>Please try again</p></div>'));
        showVisualization();
    }

    // Find the loading message
    $('#loadingMessage').remove();
}


/**
 * Cover the visualization
 */
function coverVisualization() {
    $('#cover').show();
    var viz = $('#visualization');
    $('#cover').css({
        top:viz.position().top,
        left:viz.position().left
    });
    $('#cover').width(viz.width());
    $('#cover').height(viz.height());
}

/**
 * Uncover/reveal
 */
function showVisualization() {
    $('#cover').fadeOut('fast');
}


/**
 * Generates the popover content for a node
 *  @param node         The node for which to generate the popover data
 *  @param  skipStyling Whether or not to skip the explicit styling for column widths
 */
function generateNodePopoverContent(node, skipStyling) {

    // Helper function to format a number to 2 digits
    function formatNum(num) {
        return num.toFixed(2);
    }

    // The style tags to include
    var style1 = skipStyling ? '' : "style='width:220px;'";
    var style2 = skipStyling ? '' : "style='width:90px;'";

    return "<table>" +
        "<tr><td" + style1 + "><b>CPU Usage:&nbsp;&nbsp;</b></td><td" + style2 + ">" + formatNum(node['cpuUsage']) + "</td></tr>" +
        "<tr><td><b>Memory Usage:&nbsp;&nbsp;</b></td><td>" + formatNum(node['memoryUsage']) + "</td></tr>" +
        "<tr><td><b>Context Switch Rate:&nbsp;&nbsp;</b></td><td>" + formatNum(node['contextSwitchRate']) + "</td></tr>" +
        "<tr><td><b>Last Failure Time:&nbsp;&nbsp;</b></td><td>" + node['lastFailureTime'] + "</td></tr>" +
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
                return generateNodePopoverContent(node, false);
            });
            nodeElement.popover({ delay: {
                show: 100,
                hide: 100
            }});
        }
    }
}


/**
 * Toggle play/pause of visualization
 */
function togglePlayPause() {

    // Get handles on UI elements
    var playPauseBtn = $('#playPauseBtn');
    var playPauseDiv = playPauseBtn.children('div');
    var playPauseStatus = $('#playPauseStatus');

    if(playing) {

        // Update UI
        playPauseDiv.removeClass('icon-pause');
        playPauseDiv.addClass('icon-play');
        playPauseStatus.text('Resume Viz')

    } else {

        // Update UI
        playPauseDiv.removeClass('icon-play');
        playPauseDiv.addClass('icon-pause');
        playPauseStatus.text('Pause Viz')
    }

    playing = !playing;
}


/**
 * Update the information in the node popup, given the updated state
 *  @param stateChange  The state that has changed from the update
 */
function updateNodePopovers(stateChange) {
    for(var nodeName in stateChange) {
        if(stateChange.hasOwnProperty(nodeName)) {
            $('.popover-content').html(generateNodePopoverContent(clusterState[nodeName]));
        }
    }
}


/**
 * Populate the color or size data set option menu
 *  @param  optionMenu          The jQuery selection of the corresponding option menu
 *  @param  possibleDataSets    The possible data sets of the option menu
 */
function populateDataSetMenu(optionMenu, possibleDataSets) {

    // Drop all element currently in menu
    optionMenu.children().remove();

    // Add each item to the menu
    for (var dataSetKey in possibleDataSets) {
        if (possibleDataSets.hasOwnProperty(dataSetKey)) {
            var label = possibleDataSets[dataSetKey];
            var newOption = $('<option value="' + dataSetKey + '">' + label + '</option>');
            optionMenu.append(newOption);
        }
    }
}


/**
 * Change the color data set for the current visualization from the option pane's value
 */
function chooseColorDataSet(colorDataSet) {
    visualization.setColorDataSet(colorDataSet);
    visualization.update();
    $('#legend').html(visualization.getLegendContent());
}


/**
 * Change the size data set for the current visualization from the option pane's value
 */
function chooseSizeDataSet(sizeDataSet) {
    visualization.setSizeDataSet(sizeDataSet);
    visualization.update();
    $('#legend').html(visualization.getLegendContent());
}

/**
 * Create the node visualization
 */
function createNodeVisualization(nodeName) {

    var viz = $('#visualization');
    var nodeVisualizationWrapper = $('#nodeVisualizationWrapper');

    var node = clusterState[nodeName];

    // Properly size the node visualization div
    nodeVisualizationWrapper.css({
        top:viz.position().top,
        left:viz.position().left
    });
    nodeVisualizationWrapper.width(viz.width());
    nodeVisualizationWrapper.height(viz.height());


    $('#nodeVisualization').css({
        width: $('#nodeVisualization').parent().parent().width()/2 + 'px',
        height: $('#nodeVisualization').parent().parent().height() + 'px'
    });

    // Add the default node visualization
    nodeVisualization = new PieChartNodeVisualization(node);
    nodeVisualizationWrapper.hide();

    // Set the title
    $('#nodeVisualizationTitle').html('Visualization of <i>' + nodeVisualization.getNodeName() + '</i>');

    // Show the node visualization
    nodeVisualization.construct();
}


/**
 * Show the node visualization (assumes it has been constructed)
 */
function showNodeVisualization() {
    $('#nodeVisualizationWrapper').fadeIn('fast');
}


/**
 * Hide the node visualization, and return to the main visualization
 */
function hideNodeVisualization() {
    if(nodeVisualization) {
        nodeVisualization.deconstruct();
        nodeVisualization = null;
    }
    $('#nodeVisualizationWrapper').fadeOut('fast');
}
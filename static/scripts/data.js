// The id assigned to this client
var clientId;

// The state of the entire cluster & the selected node
var clusterState;
var selectedNodeState;

// The structure of the cluster
var clusterStructure;

// the cumulative logs of the cluster
var clusterLogs = [];

// The macro & micro visualizations (cluster & node)
var visualization = null;
var nodeVisualization = null;

// Holds whether the visualization is currently planing
var playing = true;


/**
 * Receive updates from the server
 * @param data the JSON data
 */
function update(data) {

    // Only update if successful
    if(data['successful']) {

        // Collect all new log entries
        var clusterData = data['cluster'];
        var updateData = clusterData['events'];
        var logEvents = [];
        for(var i in updateData) {
            if(updateData.hasOwnProperty(i)) {
                var logEvent = updateData[i];
                logEvent.id = clusterLogs.length;
                logEvents.push(logEvent);
                clusterLogs.push(logEvent);
            }
        }

        // Update the global cluster state
        var stateChange = clusterData['stateChange'];
        updateClusterState(stateChange);
        updateNodePopovers(stateChange);

        // Update the visualization
        if(visualization && visualization!=null) {
            if(playing) {
                visualization.update(logEvents);
                if(nodeVisualization && nodeVisualization != null) {
                    nodeVisualization.update(clusterState[nodeVisualization.getNodeName()]);
                }
                updateRightSideBar();
            } else {
                console.log('Skipping viz update, viz is paused');
            }
        } else {
            console.log('Skipping update, invalid visualization');
        }

        // Get next update
        $.ajax({
            url: '/update',
            data: {
                clientId: clientId
            },
            success: update,
            error: logError,
            dataType: 'json'
        });

    } else {
        logError('Update failed: ' + data['message']);
    }
}


/**
 * Update the cluster state based on the state change provided by the simulator
 */
function updateClusterState(stateChange) {
    for(var nodeName in stateChange) {
        if(stateChange.hasOwnProperty(nodeName)) {
            for(var nodeProperty in stateChange[nodeName]) {
                if(stateChange[nodeName].hasOwnProperty(nodeProperty)) {
                    var newNodeData = stateChange[nodeName][nodeProperty];
                    if(nodeProperty === 'events') {
                        for(var i in newNodeData) {
                            if(newNodeData.hasOwnProperty(i)) {
                                clusterState[nodeName][nodeProperty].push(newNodeData[i]);
                            }
                        }
                    } else {
                        clusterState[nodeName][nodeProperty] = newNodeData;
                    }
                }
            }
        }
    }
}


/**
 * Changes the data characteristics represented by using a different simulator.
 * This requires a call to the server to ask to switch.
 * @param simulatorName the name of the simulator to be switched to
 */
function changeDataCharacteristics(simulatorName) {

    // Trigger an ajax call to the simulator server
    $.ajax({
        url: '/changeSimulator',
        data: {
            clientId: clientId,
            simulator: simulatorName
        },
        success: changeDataCharacteristicsSuccess,
        error: logError,
        dataType: 'json'
    });
}

/**
 * Called after successfully changing the simulator.
 * @param data the data sent back from the server
 */
function changeDataCharacteristicsSuccess(data) {

    if (data.hasOwnProperty("successful") && data['successful']) {
        clusterState = data['currentState'];
        clusterStructure = data['structure'];
        clusterLogs = [];

        buildRacksData();
        updateRightSideBar();

        // Reload the current visualization with the new data
        if (visualization instanceof SplomVisualization) {
            var usageMatrix = $("#theiusNavBar .active").attr("id") == "usageMatrixLink";
            changeVisualization(new SplomVisualization(clusterStructure, clusterState, usageMatrix), 'usageMatrixLink');
        }
        else {
            visualization.setStructure(clusterStructure);
            visualization.setState(clusterState);
            visualization.update();
        }

        // Start calling the AJAX update loop
        $.ajax({
            url: '/update',
            data: {
                clientId: clientId
            },
            success: update,
            error: logError,
            dataType: 'json'
        });
    }
    else {
        logError(data);
    }
}


/**
 * Subscribe this client to log updates from the simulator
 */
function subscribe() {

    // Trigger an ajax call to the simulator server
    $.ajax({
        url: '/subscribe',
        data: {},
        success: subscribeSuccess,
        error: logError,
        dataType: 'json'
    });
}


/**
 * Build a list of the racks
 */
function buildRacksData() {

    // Get the racks to build the categories list of points
    var racks = [];
    if (clusterStructure.hasOwnProperty('children')) {
        for (var i in clusterStructure['children']) {
            if (clusterStructure['children'].hasOwnProperty(i)) {
                var rack = clusterStructure['children'][i];
                var rackName = rack['name'];

                if ($.inArray(rackName, racks) < 0) {
                    racks.push(rackName);
                }

                var rack2 = rack['children'];
                for (var j in rack2) {
                    if (rack['children'].hasOwnProperty(j)) {
                        var machineName = rack['children'][j]['name'];
                        clusterState[machineName]['rack'] = rack['name'];
                    }
                }
            }
        }
    }
    return racks;
}


/**
 * Handle a successful subscribe, record client id & log it
 *  @param data The successful subscribe data
 */
function subscribeSuccess(data) {

    // Get info returned from simulator on subscribe
    clientId = data['clientId'];
    clusterState = data['currentState'];
    clusterStructure = data['structure'];
    clusterLogs = [];

    // Add the 'rack' to each node
    buildRacksData();

    // initialize right sidebar
    updateRightSideBar();

    // Build the default visualization
    changeVisualization(new TreeVisualization(clusterStructure, clusterState), 'treeLink')  ;

    // Start calling the AJAX update loop
    $.ajax({
        url: '/update',
        data: {
            clientId: clientId
        },
        success: update,
        error: logError,
        dataType: 'json'
    });
}


function logError(errorText) {
    console.log('ERROR: ' + errorText);
}

// The id assigned to this client
var clientId;

// The state of the entire cluster
var clusterState;

// The structure of the cluster
var clusterStructure;

// the cumulative logs of the cluster
var clusterLogs = [];

// The visualization to call (initialized on subscribe success)
var visualization = null;

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
        var updateData = data['events'];
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
        var stateChange = data['stateChange'];
        updateClusterState(stateChange);
        updateNodePopovers(stateChange);

        // Update the visualization
        if(visualization && visualization!=null) {
            if(playing) {
                visualization.update(logEvents);
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
                    clusterState[nodeName][nodeProperty] = stateChange[nodeName][nodeProperty];

                }
            }
        }
    }
}

function changeDataCharacteristics(simulatorName) {

    // Trigger an ajax call to the simulator server
    $.ajax({
        url: '/changeSimulator',
        data: {
            clientId: clientId,
            simulator: simulatorName
        },
        data: {},
        success: changeDataCharacteristicsSuccess,
        error: logError,
        dataType: 'json'
    });
}

function changeDataCharacteristicsSuccess(data) {

    if (data.hasOwnProperty("successful") && data['successful']) {
        data['clientId'] = clientId;
        subscribeSuccess(data);
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


/**
 * Subscribe this client to log updates from the simulator
 */
function unsubscribe() {

    // Trigger an ajax call to the simulator server
    $.ajax({
        url: '/unsubscribe',
        data: {
            clientId: clientId
        },
        success: unsubscribeSuccess,
        error: logError,
        dataType: 'json'
    });
}


/**
 * Handle a successful unsubscribe, record client id & log it
 */
function unsubscribeSuccess(data) {
    if(data['successful']) {
        console.log('Successfully unsubscribed');
    } else {
        console.log('Failed to unsubscribe: ' + data['Successfully unsubscribed']);
    }
}

function logError(errorText) {
    console.log('ERROR: ' + errorText);
}

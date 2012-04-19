// The id assigned to this client
var clientId;

// The state of the entire cluster
var clusterState;

// The structure of the cluster
var clusterStructure;

// The visualization to call (initialized on subscribe success)
var visualization = null;


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
                logEvents.push(logEvent);
            }
        }

        // Update the global cluster state
        var stateChange = data['stateChange'];
        updateClusterState(stateChange);

        // Update the visualization
        visualization.update(logEvents);

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
 * Handle a successful subscribe, record client id & log it
 *  @param data The successful subscribe data
 */
function subscribeSuccess(data) {

    // Get info returned from simulator on subscribe
    clientId = data['clientId'];
    clusterState = data['currentState'];
    clusterStructure = data['structure'];

    // Build the default visualization
    visualization = new TreeVisualization(clusterStructure, clusterState);

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

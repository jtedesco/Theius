// The id assigned to this client
var clientId;

// The state of the entire cluster
var clusterState;

/**
 * Receive updates from the server
 * @param data the JSON data
 */
function receiveUpdate(data) {

    if(data['successful']) {

        // Process all new log entries
        var updateData = data['events'];
        for(var i in updateData) {
            if(updateData.hasOwnProperty(i)) {
                var logEvent = updateData[i];
                processLogEntry(logEvent);
            }
        }

        // Update the global cluster state
        var stateChange = data['stateChange'];
        updateClusterState(stateChange);

        $.ajax({
            url: '/update',
            data: {
                clientId: clientId
            },
            success: receiveUpdate,
            error: logError,
            dataType: 'json'
        });

    } else {
        logError('Update failed: ' + data['message']);
    }
}

function updateClusterState(stateChange) {
//    console.log(stateChange);
}


/**
 * Decide what to do with the log entry that was received here
 * @param logEvent the log entry received from the server
 */
function processLogEntry(logEvent) {
    if (window.data.hasOwnProperty(logEvent['location'])) {

        var node = window.data[logEvent['location']];

        for (var elem in logEvent) {
            if (logEvent.hasOwnProperty(elem)) {
                node[elem] = logEvent[elem]; // copy over data
            }
        }

        redrawGraph();
    }
    else {
        logError("Key \"" + logEvent['location'] + "\" not found");
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

    // Get the structure of the network & build the default visualization
    var structure = data['structure'];
    var nodes = loadGraph(structure);
    loadData(nodes);

    // tie data to circle color and radius
//    circleColor(window.data, 'color');
//    circleRadius(window.data, 'value');

    // Start calling the AJAX update loop
    $.ajax({
        url: '/update',
        data: {
            clientId: clientId
        },
        success: receiveUpdate,
        error: logError,
        dataType: 'json'
    });
}


/**
 * Loads the nodes into the global map "data"
 * Some default values are also given to the nodes
 * This function is essentially converting an array of nodes to a map
 * from the name of a node to a node object.
 * @param nodes an array of nodes
 */
function loadData(nodes) {
    window.data = {};
    for (var i in nodes){
        if (nodes.hasOwnProperty(i)) {
            window.data[nodes[i]['name']] = nodes[i];
            nodes[i]['value'] = 5;
        }
    }
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
        var message = 'Successfully unsubscribed';
        console.log(message);
    } else {
        var message = 'Failed to unsubscribe: ' + data['message'];
        console.log(message);
    }
}


/**
 * Handle some AJX error by logging it
 * @param errorData
 */
function logError(errorData) {
    var message = 'ERROR: ' + errorData;
    console.log(message);
}

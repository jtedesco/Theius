/**
 * Appends a given message to the 'garbage' div (for demo purposes only)
 * @param message
 */
function appendToGarbage(message) {
    $('#garbage').html($('#garbage').html() + message + '<br/>');
}

// The id assigned to this client
var clientId;

/**
 * Receive updates from the server
 * @param data the JSON data
 */
function receiveUpdate(data) {

    if(data['successful']) {

        var updateData = $.parseJSON(data['updates']);

        for(var i in updateData) {
            if(updateData.hasOwnProperty(i)) {
                var logEvent = updateData[i];
                processLogEntry(logEvent);
            }
        }

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

/**
 * Decide what to do with the log entry that was received here
 * @param logEvent the log entry received from the server
 */
function processLogEntry(logEvent) {
    if (window.data.hasOwnProperty(logEvent['name'])) {

        var node = window.data[logEvent['name']];

        for (var elem in logEvent) {
            if (logEvent.hasOwnProperty(elem)) {
                node[elem] = logEvent[elem]; // copy over data
            }
        }

        redrawGraph();
    }
    else {
        logError("Key \"" + logEvent['name'] + "\" not found");
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
    clientId = data['clientId'];
    var message = 'Client ID: ' + clientId;
    appendToGarbage(message);

    // Retreive the graph
    $.ajax({
        url: '/structure',
        data: {},
        success: structureSuccess,
        error: logError,
        dataType: 'json'
    });
}

/**
 * Handles a successful fetching of the node structure by displaying it
 * @param data the JSON node structure data
 */
function structureSuccess(data) {
    var nodes = loadGraph(data);
    loadData(nodes);

    // tie data to circle color and radius
    circleColor(window.data, 'color');
    circleRadius(window.data, 'value');

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
        appendToGarbage(message);
    } else {
        var message = 'Failed to unsubscribe: ' + data['message'];
        appendToGarbage(message);
    }
}


/**
 * Handle some AJX error by logging it
 * @param errorData
 */
function logError(errorData) {
    var message = 'ERROR: ' + errorData;
    appendToGarbage(message);
}

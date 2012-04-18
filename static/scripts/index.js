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
 * Receive updates from the
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
    //console.log(logEvent.data);
    //appendToGarbage('Received log event ' + logEvent.number + ': "' + logEvent.data + '"');
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
    displayGraph(data);

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

/**
 * Tests the resizeCircles function by running it on some sample data
 */
function testCircleResizing() {
    $.ajax({
        url: '/sampleData',
        data: {},
        success: resizeCircles,
        error: logError,
        dataType: 'json'
    });
}

function testColorChanging() {
    $.ajax({
        url: '/colorData',
        success: changeColors,
        error: logError,
        dataType: 'json'
    });
}
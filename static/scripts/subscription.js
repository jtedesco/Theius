// The id assigned to this client
var clientId;

/**
 * Receive updates from the
 */
function receiveUpdate(data) {

    if(data['successful']) {

        appendToGarbage('Received updates, processing...');

        var updateData = $.parseJSON(data['updates']);

        for(var i in updateData) {
            var logEvent = updateData[i];
            appendToGarbage('Received log event ' + logEvent.number);
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
    var message = 'ERROR: ' + errorData.statusText;
    appendToGarbage(message);
}
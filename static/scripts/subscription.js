// The id assigned to this client
var clientId;


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
    var message = 'Successfully unsubscribed from log updates';
    appendToGarbage(message);
}


/**
 * Handle some AJX error by logging it
 * @param errorData
 */
function logError(errorData) {
    var message = 'ERROR: ' + errorData.statusText;
    appendToGarbage(message);
}
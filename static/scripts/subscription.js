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
        error: alertError,
        dataType: 'json'
    });
}

/**
 * Handle a successful subscribe, record client id & log it
 *  @param data The successful subscribe data
 */
function subscribeSuccess(data) {
    clientId = data['clientId'];
    console.log('Client ID: ' + clientId);
}

/**
 * Handle some AJX error
 * @param errorData
 */
function alertError(errorData) {
    console.log('ERROR: ' + errorData.statusText);
}
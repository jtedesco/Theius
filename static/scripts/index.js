/**
 * Appends a given message to the 'garbage' div (for demo purposes only)
 * @param message
 */
function appendToGarbage(message) {
    $('#garbage').html($('#garbage').html() + message + '<br/>');
}
/**
 * Helper function to return the value of some dictionary or nested dictionary by splitting on '.' character
 */
function getCompoundKeyFromDict(dictionary, key) {
    var keys = key.split('.');
    if (keys.length > 2) {
        console.log('Cannot use more than one level of nested keys!');
        return null;
    } else if (keys.length === 2) {
        return dictionary[keys[0]][keys[1]];
    } else {
        return dictionary[keys[0]];
    }
}

function deepCopy(obj) {
    return jQuery.extend(true, {}, obj);
}
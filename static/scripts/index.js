/**
 * Smoothly transitions to a new visualization
 *
 * @param newVisualization  The new visualization object, attached to the page data
 * @param liId              The id of the nav element to mark as active
 */
function changeVisualization(newVisualization, liId) {

    // Update the active entry in the nav bar
    $('.navbar li').removeClass('active');
    $('#' + liId).addClass('active');

    // Remove the current content of the visualization
    $('.visualization').fadeOut('fast');
    $('.visualization').children().remove();

    // Show a loading message temporarily
    $('.visualization').parent().prepend('<div id="loadingMessage" class="hero-unit"><h3>Loading...</h3><br/><p>Please be patient</p></div>');

    // Update the visualization variable
    visualization = newVisualization;
    if(visualization != null) {
        visualization.initialize();
    }

    // Find the loading message
    $('#loadingMessage').remove();

    $('.visualization').fadeIn('fast');
}
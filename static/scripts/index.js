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
    $('.visualization').find('svg').remove();
    $('.visualization').hide();
    $('#visualizationTitle').hide();
    $('#visualizationWrapper .hero-unit').remove();

    // Show a loading message temporarily
    $('#visualizationWrapper').prepend($('<div id="loadingMessage" class="hero-unit"><h3>Loading...</h3><br/><p>Please be patient</p></div>'));

    // Update the visualization variable
    visualization = newVisualization;
    if(visualization != null) {
        visualization.initialize();
        visualization.update([]);

        // Show the title for the visualization
        var visualizationTitle = $('#visualizationTitle');
        visualizationTitle.html("<h3>" + visualization.title() + "</h3>");
        visualizationTitle.show();

    } else {
        $('#visualizationWrapper').prepend($('<div id="errorMessage" class="hero-unit"><h3>Error loading visualization</h3><br/><p>Please try again</p></div>'));
    }

    // Find the loading message
    $('#loadingMessage').remove();
    $('.visualization').fadeIn('fast');
}
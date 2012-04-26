/**
 * Shows a stream graph of the distribution of logs or
 */
function PieChartNodeVisualization(nodeState) {

    var This = this;

    // The identifier for the node being visualized
    this.nodeName = nodeState.name;

    // The state for this node
    this.nodeState = nodeState;

    // The current data set configuration (severity or facility)
    this.dataSet = 'severity';

    /**
     * Gets the array of possible values of event labels
     */
    var getLabels = function() {
        if(This.dataSet === 'severity') {
            return [
                'INFO',
                'WARN',
                'ERROR',
                'FATAL'
            ];
        } else {
            return [
                'MMCS',
                'APP',
                'KERNEL',
                'LINKCARD',
                'MONITOR',
                'HARDWARE',
                'DISCOVERY'
            ];
        }
    };


    /**
     * Gets the label corresponding to the severity level of the log (0-3), or facility
     */
    var getEventLabel = function(level) {
        return getLabels()[level];
    };


    /**
     * Gets a dictionary containing the fraction of logs that are at each log level or facility
     */
    var groupLogs = function() {

        var eventsByLevel = {};
        var totalEventCount = 0;

        var labels = getLabels();
        for(var i in labels) {
            if(labels.hasOwnProperty(i)) {
                eventsByLevel[labels[i]] = [];
            }
        }

        for(var index in nodeState.events) {
            if(nodeState.events.hasOwnProperty(index)) {

                var event = nodeState.events[index];
                var eventLabel = event[This.dataSet];

                eventsByLevel[eventLabel].push(event);
                totalEventCount++;
            }
        }

        eventsByLevel['totalCount'] = totalEventCount;

        return eventsByLevel;
    };


    /**
     * Sets the 'dataSet' parameter
     */
    this.setDataSet = function(dataSet) {
        This.dataSet = dataSet;
    };


    /**
     * Gets the identifier for the node being visualization
     */
    this.getNodeName = function() {
        return This.nodeName;
    };


    /**
     * Helper function to draw the stream graph, assuming there is nothing in the node visualization yet
     */
    var drawStreamGraph = function(eventsByLevel) {

        var nodeVisualizationDiv = $('#nodeVisualization');

        // Update the node stats
        $('#nodeVisualizationStats').html(generateNodePopoverContent(This.nodeState, true));

        console.log('drawing');
    };


    /**
     * Builds the node visualization
     */
    this.construct = function() {

        var eventsByLevel = groupLogs();
        var nodeVisualizationDiv = $('#nodeVisualization');

        if(eventsByLevel['totalCount'] > 0) {
            drawStreamGraph(eventsByLevel);
        } else {
            nodeVisualizationDiv.html('<br/><br/><h4>No logs to display!</h4>')
        }

        // Actually show the node visualization
        showNodeVisualization();
    };


    /**
     * Updates the active nodeVisualization with the node's new state
     */
    this.update = function(newNodeState) {
        This.nodeState = newNodeState;
    };


    /**
     * Deconstructs this node visualization (and in general, the active node visualization)
     */
    this.deconstruct = function() {
        $('#nodeVisualization').children().fadeOut('fast');
    }
}
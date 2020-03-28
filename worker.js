var source = new EventSource("/events/");
var count = 0;
source.onmessage = function(e) {
    postMessage(e.data);
    if (++count > 10 ) {
        source.close();
        postMessage("eventSource.close()");
    }
};
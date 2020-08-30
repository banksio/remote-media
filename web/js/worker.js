onmessage = function(data) {
    console.log('Message received from main script');
    let tableHTML = "";
    let queue = data.data;
    var i = 1;
    for (var video of queue.videos) {
        if (i == queue.index + 1) {
            tableHTML = tableHTML + '<tr id="queue-table-video-' + i + '" class="tr-active"><td>' + i + '</td><td>' + video.title + '</td><td>' + video.channel + '</td></tr>';
        }
        else {
            tableHTML = tableHTML + '<tr id="queue-table-video-' + i + '"><td>' + i + '</td><td>' + video.title + '</td><td>' + video.channel + '</td></tr>';
        }
        i++;
    }
    console.log('Posting message back to main script');
    postMessage(tableHTML);
}
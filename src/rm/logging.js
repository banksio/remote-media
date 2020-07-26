//function to provide well formatted date for console messages
function consoleLogWithTime(msg) {
    let now = new Date();
    let year = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(now);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(now);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(now);
    console.log("[" + day + "/" + month + "/" + year + "]" + "[" + ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "] " + msg);
}

function prettyPrintClientID(client) {
    return (client.id + " (" + client.name + ")");
}

module.exports = {
    "withTime": consoleLogWithTime,
    "prettyPrintClientID": prettyPrintClientID
};
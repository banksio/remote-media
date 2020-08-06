//function to provide well formatted date for console messages
function consoleLogWithTime(msg, date = new Date()) {
    let year = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(date);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    console.log("[" + day + "/" + month + "/" + year + "]" + "[" + ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2) + ":" + ('0' + date.getSeconds()).slice(-2) + "] " + msg);
}

function prettyPrintClientID(client) {
    return (client.id + " (" + client.name + ")");
}

module.exports = {
    "withTime": consoleLogWithTime,
    "prettyPrintClientID": prettyPrintClientID
};
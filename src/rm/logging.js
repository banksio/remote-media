const chalk = require("chalk");

//function to provide well formatted date for console messages
function consoleLogWithTime(msg, date = new Date()) {
    console.log(dateAndTime() + " " + msg);
}

function dateAndTime(date = new Date()) {
    let year = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(date);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    return "[" + day + "/" + month + "/" + year + "]" + "[" + ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2) + ":" + ('0' + date.getSeconds()).slice(-2) + "]";
}

function prettyPrintClientID(client) {
    return (client.id + " (" + client.name + ")");
}

function debug(msg) {
    console.log(chalk.magenta(dateAndTime() + "[DEBUG]\t" + msg));
}

function info(msg) {
    console.log(chalk.blue(dateAndTime() + "[INFO]\t" + msg));
}

function error(msg) {
    console.log(chalk.red(dateAndTime() + "[ERROR]\t" + msg));
}

function warning(msg) {
    console.log(chalk.yellowBright(dateAndTime() + "[WARN]\t" + msg));
}

module.exports = {
    "withTime": consoleLogWithTime,
    "prettyPrintClientID": prettyPrintClientID,
    "debug": debug,
    "info": info,
    "error": error,
    "warn": warning
};
// function to provide well formatted date for console messages
function dateAndTime(date = new Date()) {
    const year = new Intl.DateTimeFormat("en", { year: "2-digit" }).format(date);
    const month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
    const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
    return (
        "[" +
        day +
        "/" +
        month +
        "/" +
        year +
        "]" +
        "[" +
        ("0" + date.getHours()).slice(-2) +
        ":" +
        ("0" + date.getMinutes()).slice(-2) +
        ":" +
        ("0" + date.getSeconds()).slice(-2) +
        "]"
    );
}

function formatStringWithTime(msg: string): any {
    return dateAndTime() + " " + msg;
}

export function consoleLogWithTime(msg: string, date = new Date()) {
    console.log(formatStringWithTime(msg));
}

export function consoleErrorWithTime(msg: string, date = new Date()) {
    console.error(formatStringWithTime);
}

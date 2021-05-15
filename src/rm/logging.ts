import chalk from "chalk";
import { Client } from "./client/client";

// function to provide well formatted date for console messages
export function consoleLogWithTime(msg: string, date = new Date()) {
    console.log(dateAndTime() + " " + msg);
}

export function dateAndTime(date = new Date()) {
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

export function prettyPrintClientID(client: Client) {
    return client.id + " (" + client.name + ")";
}

export function debug(msg: string) {
    console.log(chalk.magenta(dateAndTime() + "[DEBUG]\t" + msg));
}

export function info(msg: string) {
    console.log(chalk.blue(dateAndTime() + "[INFO]\t" + msg));
}

export function error(msg: string) {
    console.log(chalk.red(dateAndTime() + "[ERROR]\t" + msg));
}

export function warning(msg: string) {
    console.log(chalk.yellowBright(dateAndTime() + "[WARN]\t" + msg));
}

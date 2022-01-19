export function shuffle(array: Array<any>) {
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;
    // console.log("                               Length is " + currentIndex);
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    // console.log(array);
    return array;
}

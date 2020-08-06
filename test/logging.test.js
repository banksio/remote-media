const assert = require('assert');
const sinon = require('sinon');
const logging = require('../src/rm/logging');
const classes = require('../web/js/classes');

describe('Logging function tests', function () {
    
    it('Should log to the console with the time and date', function () {
        let spy = sinon.spy(console, 'log');
        let valueOfLogTest = "Test";

        let now = new Date();
        let year = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(now);
        let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(now);
        let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(now);
        let valueOfLogReturn = "[" + day + "/" + month + "/" + year + "]" + "[" + ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "] " + valueOfLogTest;

        // call the function that needs to be tested
        logging.withTime(valueOfLogTest, now);

        // TODO: This will sometimes fail due to the system time changing in-between statements
        // assert that it logged the correct value
        assert(spy.calledWith(valueOfLogReturn));

        // restore the original function
        spy.restore();
    });

    it('Should return both the client ID and name', function () {
        let client = new classes.Login("testID", undefined, "testName");

        assert.equal(logging.prettyPrintClientID(client) ,client.id + " (" + client.name + ")")
    });
});
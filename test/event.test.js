const assert = require('assert');

const testHelpers = require('../src/test/setupFunctions');

// Classes
var classes = require('../web/js/classes');
const { event } = require("../web/js/event")

// Test event class constructor
describe('event object constructor', function () {
    it('Should add broadcast event from constructor', function () {
        let expected = "testData";
        let newEvent = new event("testEvent", expected);
        assert.strictEqual(newEvent.broadcastEvents.testEvent, expected)
    });
    it('Should not add event as no data parameter', function () {
        let newEvent = new event("testEvent");

        assert.ok(!newEvent.broadcastEvents.testEvent)
    });
    it('Should not add event as no event parameter', function () {
        let newEvent = new event(undefined, "testData");

        assert.ok(!newEvent.broadcastEvents.testEvent)
    });
});

// Test event class methods
describe('event object methods', function () {
    it('Should add broadcast event from construct', function () {
        let expected = "testData";
        let newEvent = new event("testEvent", expected);
        assert.strictEqual(newEvent.broadcastEvents.testEvent, expected)
    });
    it('Should add send event from construct', function () {
        let expectedEvent = "testEvent";
        let expectedData = "testData";
        let newEvent = new event();
        newEvent.addBroadcastEventFromConstruct({
            event: expectedEvent,
            data: expectedData
        })
        assert.ok(newEvent.broadcastEvents[expectedEvent]);
        assert.strictEqual(newEvent.broadcastEvents.testEvent, expectedData);
    });
    it('Should add broadcast event from construct', function () {
        let expectedEvent = "testEvent";
        let expectedData = "testData";
        let newEvent = new event();
        newEvent.addSendEventFromConstruct({
            event: expectedEvent,
            data: expectedData
        })
        assert.ok(newEvent.sendEvents[expectedEvent]);
        assert.strictEqual(newEvent.sendEvents.testEvent, expectedData);
    });
    it('Should throw as no event', function () {
        let expectedData = "testData";
        let newEvent = new event();
        assert.throws(() => {newEvent.addBroadcastEvent(undefined, expectedData)})
    });
    it('Should throw as no data', function () {
        let expectedEvent = "testEvent";
        let newEvent = new event();
        assert.throws(() => {newEvent.addBroadcastEvent(expectedEvent)})
    });
    it('Should throw as no event', function () {
        let expectedData = "testData";
        let newEvent = new event();
        assert.throws(() => {newEvent.addSendEvent(undefined, expectedData)})
    });
    it('Should throw as no data', function () {
        let expectedEvent = "testEvent";
        let newEvent = new event();
        assert.throws(() => {newEvent.addSendEvent(expectedEvent)})
    });
    it('Should throw as no event', function () {
        let expectedEvent = "testEvent";
        let newEvent = new event();
        assert.throws(() => {newEvent.addBroadcastEventFromConstruct({
            event: expectedEvent
        })})
    });
    it('Should throw as no data', function () {
        let expectedData = "testData";
        let newEvent = new event();
        assert.throws(() => {newEvent.addBroadcastEventFromConstruct({
            data: expectedData
        })})
    });
    it('Should throw as no event', function () {
        let expectedEvent = "testEvent";
        let newEvent = new event();
        assert.throws(() => {newEvent.addSendEventFromConstruct({
            event: expectedEvent
        })})
    });
    it('Should throw as no data', function () {
        let expectedData = "testData";
        let newEvent = new event();
        assert.throws(() => {newEvent.addSendEventFromConstruct({
            data: expectedData
        })})
    });
});
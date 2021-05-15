const assert = require("assert");
const { event } = require("../web/js/event");

// Test event class constructor
describe("event object constructor", () => {
    it("Should add broadcast event from constructor", () => {
        const expected = "testData";
        const newEvent = new event("testEvent", expected);
        assert.strictEqual(newEvent.broadcastEvents.testEvent, expected);
    });
    it("Should not add event as no data parameter", () => {
        const newEvent = new event("testEvent");

        assert.ok(!newEvent.broadcastEvents.testEvent);
    });
    it("Should not add event as no event parameter", () => {
        const newEvent = new event(undefined, "testData");

        assert.ok(!newEvent.broadcastEvents.testEvent);
    });
});

// Test event class methods
describe("event object methods", () => {
    it("Should add broadcast event from construct", () => {
        const expected = "testData";
        const newEvent = new event("testEvent", expected);
        assert.strictEqual(newEvent.broadcastEvents.testEvent, expected);
    });
    it("Should add send event from construct", () => {
        const expectedEvent = "testEvent";
        const expectedData = "testData";
        const newEvent = new event();
        newEvent.addBroadcastEventFromConstruct({
            event: expectedEvent,
            data: expectedData,
        });
        assert.ok(newEvent.broadcastEvents[expectedEvent]);
        assert.strictEqual(newEvent.broadcastEvents.testEvent, expectedData);
    });
    it("Should add broadcast event from construct", () => {
        const expectedEvent = "testEvent";
        const expectedData = "testData";
        const newEvent = new event();
        newEvent.addSendEventFromConstruct({
            event: expectedEvent,
            data: expectedData,
        });
        assert.ok(newEvent.sendEvents[expectedEvent]);
        assert.strictEqual(newEvent.sendEvents.testEvent, expectedData);
    });
    it("Should throw as no event", () => {
        const expectedData = "testData";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addBroadcastEvent(undefined, expectedData);
        });
    });
    it("Should throw as no data", () => {
        const expectedEvent = "testEvent";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addBroadcastEvent(expectedEvent);
        });
    });
    it("Should throw as no event", () => {
        const expectedData = "testData";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addSendEvent(undefined, expectedData);
        });
    });
    it("Should throw as no data", () => {
        const expectedEvent = "testEvent";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addSendEvent(expectedEvent);
        });
    });
    it("Should throw as no event", () => {
        const expectedEvent = "testEvent";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addBroadcastEventFromConstruct({
                event: expectedEvent,
            });
        });
    });
    it("Should throw as no data", () => {
        const expectedData = "testData";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addBroadcastEventFromConstruct({
                data: expectedData,
            });
        });
    });
    it("Should throw as no event", () => {
        const expectedEvent = "testEvent";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addSendEventFromConstruct({
                event: expectedEvent,
            });
        });
    });
    it("Should throw as no data", () => {
        const expectedData = "testData";
        const newEvent = new event();
        assert.throws(() => {
            newEvent.addSendEventFromConstruct({
                data: expectedData,
            });
        });
    });
});

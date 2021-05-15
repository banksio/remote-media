const assert = require("assert");

class AssertMultiple {
    constructor(count, expected, cb) {
        this.totalCount = count;
        this.expected = expected;
        this.cb = cb;
        this._count = 0;
    }

    strictEqual(actual) {
        assert.strictEqual(actual, this.expected);
        this.count += 1;
    }

    deepStrictEqual(actual) {
        assert.deepStrictEqual(actual, this.expected);
        this.count += 1;
    }

    get count() {
        return this._count;
    }

    set count(count) {
        this._count = count;
        if (this._count >= this.totalCount) {
            return this.cb();
        }
    }
}

class SocketCounter {
    constructor(count, cb) {
        this.totalCount = count;
        this.cb = cb;
        this._count = 0;
    }

    incrementCount() {
        this._count += 1;
        if (this._count >= this.totalCount) {
            return this.cb();
        }
    }
}

module.exports = {
    AssertMultiple: AssertMultiple,
    SocketCounter: SocketCounter,
};

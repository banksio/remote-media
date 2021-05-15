const assert = require("assert");
const sinon = require("sinon");

const { event } = require("../web/js/event");

const testHelpers = require("../src/test/setupFunctions");

// Classes
const classes = require("../src/rm/classes");
const { queue } = require("jquery");
const { Video, ServerVideo, Login } = require("../src/rm/classes");

// Test video object ID parsing
describe("Video object URL parsing test", () => {
    const video = new classes.Video();
    beforeEach(() => {
        // video.id = undefined;
    });
    it("Short youtu.be - ID should be p47fEXGabaY", () => {
        video.setIDFromURL("https://youtu.be/p47fEXGabaY");
        assert.equal(video.id, "p47fEXGabaY");
    });
    it("Short youtu.be - ID should be ez1Kv8hiQGU", () => {
        video.setIDFromURL("https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        assert.equal(video.id, "ez1Kv8hiQGU");
    });
    it("Full length link - ID should be UBhdIcb84Hw", () => {
        video.setIDFromURL("https://www.youtube.com/watch?v=UBhdIcb84Hw");
        assert.equal(video.id, "UBhdIcb84Hw");
    });
    it("Full length link with playlist - ID should be UBhdIcb84Hw", () => {
        video.setIDFromURL(
            "https://www.youtube.com/watch?v=xi3c-9qzrPY&list=RDMMEK_LN3XEcnw&index=11"
        );
        assert.equal(video.id, "xi3c-9qzrPY");
    });
    it("Invalid video URL, should return undefined", () => {
        assert.throws(() => {
            video.setIDFromURL(
                "https://www.youtube.com/playlist?list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG"
            );
        });
        // assert.throws(video.id, undefined);
    });
});

// Queue tests
// describe('Queue tests', function () {
//     let video = new classes.Video("p47fEXGabaY");
//     it('Add single video, expect correct video object and queue length', function () {
//         let queue = new classes.Queue();
//         queue.addVideo(video);
//         assert.equal(queue.length, 1);
//         assert.equal(queue.popVideo(), video);
//         assert.equal(queue.length, 0);
//     });
//     it('Add single video from ID, expect correct video ID and queue length', function () {
//         let queue = new classes.Queue();
//         queue.addVideoFromID(video.id);
//         assert.equal(queue.length, 1);
//         assert.equal(queue.popVideo().id, video.id);
//         assert.equal(queue.length, 0);
//     });
//     it('Add two videos from CSV test queue length, ID and pop from queue', function () {
//         let queue = new classes.Queue();
//         queue.addVideosFromURLs("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
//         assert.equal(queue.length, 2);
//         assert.equal(queue.popVideo().id, "xi3c-9qzrPY");
//         assert.equal(queue.length, 1);
//         assert.equal(queue.popVideo().id, "ez1Kv8hiQGU");
//         assert.equal(queue.length, 0);
//     });
//     it('Add one video from CSV, expect nothing added', function () {
//         let queue = new classes.Queue();
//         queue.addVideosFromURLs("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw");
//         assert.equal(queue.length, 0);
//         assert.equal(queue.popVideo(), undefined);
//         assert.equal(queue.length, 0);
//     });

//     it('Add single video, get video from queue', function () {
//         let queue = new classes.Queue();
//         queue.addVideo(video);
//         assert.equal(queue.popVideo(), video);
//     });
// });

// Queue tests
describe("NewQueue tests", () => {
    const video = new classes.Video("p47fEXGabaY");
    const video2 = new classes.Video("vWaRiD5ym74");
    it("Add single video, expect correct video object and queue length", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        assert.strictEqual(queue.length, 1);
        assert.deepStrictEqual(queue.nextVideo(), video);
        assert.strictEqual(queue.length, 0);
    });
    it("Add single video from ID, expect correct video ID and queue length", () => {
        const queue = new classes.NewQueue();
        queue.addVideoFromID(video.id);
        assert.strictEqual(queue.length, 1);
        assert.strictEqual(queue.nextVideo().id, video.id);
        assert.strictEqual(queue.length, 0);
    });
    it("Add two videos from CSV test queue length, ID and pop from queue", () => {
        const queue = new classes.NewQueue();
        queue.addVideosFromCSV(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue.nextVideo().id, "xi3c-9qzrPY");
        assert.strictEqual(queue.length, 1);
        assert.strictEqual(queue.nextVideo().id, "ez1Kv8hiQGU");
        assert.strictEqual(queue.length, 0);
    });
    it("Add one video from CSV, expect nothing added", () => {
        const queue = new classes.NewQueue();
        queue.addVideosFromCSV(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw"
        );
        assert.strictEqual(queue.length, 0);
        assert.throws(queue.nextVideo, undefined);
        assert.strictEqual(queue.length, 0);
    });

    it("Should add playlist JSON", () => {
        const rmPlaylistJSON = `RMPLYLST{
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s": {
                "title": "Robbie Williams - Rock DJ",
                "channel": "Robbie Williams"
            },
            "https://www.youtube.com/watch?v=yC8SPG2LwSA&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=3&t=0s": {
                "title": "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]",
                "channel": "Clean Bandit"
            }
        }`;
        const queue = new classes.NewQueue();
        queue.addVideosCombo(rmPlaylistJSON);
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue.peekNextVideo().id, "BnO3nijfYmU");
        assert.strictEqual(
            queue.peekNextVideo().title,
            "Robbie Williams - Rock DJ"
        );
        assert.strictEqual(queue.nextVideo().channel, "Robbie Williams");
        assert.strictEqual(queue.peekNextVideo().id, "yC8SPG2LwSA");
        assert.strictEqual(
            queue.peekNextVideo().title,
            "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]"
        );
        assert.strictEqual(queue.peekNextVideo().channel, "Clean Bandit");
    });

    it("Should detect corrupt playlist JSON", () => {
        const rmPlaylistJSON = `RMPLYLST{
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s": {
                "title": "Robbie Williams - Rock DJ",
                "channel": "Robbie Williams"
            },
            "https://www.youtube.com/watch?v=yC8SPG2LwSA&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=3&t=0s": {
                "title": "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]",
                "channel": "Clean Bandit"
            }`;
        const queue = new classes.NewQueue();
        assert.throws(() => {
            queue.addVideosCombo(rmPlaylistJSON);
        });
    });

    it("Should add two videos from CSV", () => {
        const queue = new classes.NewQueue();
        queue.addVideosCombo(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue.nextVideo().id, "xi3c-9qzrPY");
        assert.strictEqual(queue.length, 1);
        assert.strictEqual(queue.nextVideo().id, "ez1Kv8hiQGU");
        assert.strictEqual(queue.length, 0);
    });

    it("Should add single video", () => {
        const queue = new classes.NewQueue();
        queue.addVideosCombo("https://www.youtube.com/watch?v=BnO3nijfYmU");
        assert.strictEqual(queue.length, 1);
        assert.deepStrictEqual(queue.nextVideo().id, "BnO3nijfYmU");
        assert.strictEqual(queue.length, 0);
    });

    it("Should return next video and advance queue", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        assert.deepStrictEqual(queue.nextVideo(), video);
        assert.strictEqual(queue.nextVideo(), undefined);
    });

    it("Should return previous video and change index", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        assert.deepStrictEqual(queue.nextVideo(), video);
        assert.strictEqual(queue.previousVideo(), undefined); // There should be no previous video, it's the start of the queue
        assert.deepStrictEqual(queue.nextVideo(), video2);
        assert.deepStrictEqual(queue.previousVideo(), video); // There should now be a previous video
    });

    it("Should return previous video and change index when shuffling", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        queue.shuffle = true;

        const shuffleVideo1 = queue.nextVideo();
        const shuffleVideo2 = queue.nextVideo();

        assert.notDeepStrictEqual(shuffleVideo1, shuffleVideo2); // These should be different, shuffle is on
        assert.deepStrictEqual(queue.previousVideo(), shuffleVideo1); // There should be no previous video, it's the start of the queue
    });

    it("Should return previous video and not change index", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);

        queue.nextVideo();
        queue.nextVideo();
        queue.peekPreviousVideo;

        assert.deepStrictEqual(queue.peekPreviousVideo(), video);
        assert.deepStrictEqual(queue.previousVideo(), video); // There should now be a previous video
    });

    it("Should return previous video and not change index when shuffling", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        queue.shuffle = true;

        const shuffleVideo1 = queue.nextVideo();
        const shuffleVideo2 = queue.nextVideo();

        assert.notDeepStrictEqual(shuffleVideo1, shuffleVideo2); // These should be different, shuffle is on
        assert.deepStrictEqual(queue.peekPreviousVideo(), shuffleVideo1); // There should be no previous video, it's the start of the queue
        assert.deepStrictEqual(queue.previousVideo(), shuffleVideo1); // There should be no previous video, it's the start of the queue
    });

    it("Should return next video and not change index", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);

        assert.deepStrictEqual(queue.peekNextVideo(), video);
        assert.deepStrictEqual(queue.nextVideo(), video); // Should be the same as peek should not have changed the index
    });

    it("Should return next video and not change index when shuffling", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        queue.shuffle = true;

        const shuffleVideo1 = queue.nextVideo();
        const shuffleVideo2 = queue.nextVideo();
        queue.previousVideo();

        assert.notDeepStrictEqual(shuffleVideo1, shuffleVideo2); // These should be different, shuffle is on
        assert.deepStrictEqual(queue.peekNextVideo(), shuffleVideo2);
        assert.deepStrictEqual(queue.nextVideo(), shuffleVideo2); // Should be the same as peek should not have changed the index
    });

    it("Should have the same length when shuffled", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        const expected = 2;

        assert.strictEqual(queue.videos.length, expected);
        queue.shuffle = true;
        assert.strictEqual(queue.videos.length, expected);
    });

    it("Should empty and reset the queue", () => {
        const queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.empty();

        // Check both queues are empty
        assert.strictEqual(queue.videos.length, 0); // might not be necessary
        queue.shuffle = false;
        console.log(queue.videos.length);
        assert.strictEqual(queue.videos.length, 0);
        queue.shuffle = true;
        assert.strictEqual(queue.videos.length, 0);
        console.log(queue.videos.length);
        console.log(queue.videos);
        console.log(JSON.stringify(queue.videos));

        assert.strictEqual(queue._currentIndex, -1);
        assert.strictEqual(queue.nextVideo(), undefined);
        assert.strictEqual(queue.previousVideo(), undefined);
        assert.strictEqual(queue.unplayedVideos, false);
    });

    it("Should shuffle queue", () => {
        const queue = new classes.NewQueue();
        queue.addVideosCombo(`RMPLYLST{
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s": {
                "title": "Robbie Williams - Rock DJ",
                "channel": "Robbie Williams"
            },
            "https://www.youtube.com/watch?v=yC8SPG2LwSA&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=3&t=0s": {
                "title": "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]",
                "channel": "Clean Bandit"
            },
            "https://www.youtube.com/watch?v=nsDwItoNlLc&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=5&t=0s": {
                "title": "Tinie Tempah ft. Jess Glynne - Not Letting Go (Official Video)",
                "channel": "Tinie"
            },
            "https://www.youtube.com/watch?v=jzAv69sh_-4&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=6&t=0s": {
                "title": "The Fear",
                "channel": "Lily Allen"
            },
            "https://www.youtube.com/watch?v=dAVyKuS_noI&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=7&t=0s": {
                "title": "MK - 2AM (Official Video) ft. Carla Monroe",
                "channel": "MK"
            },
            "https://www.youtube.com/watch?v=e2IpYd6Pu3s&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=8&t=0s": {
                "title": "Izzy Bizu - White Tiger (Official Video)",
                "channel": "Izzy Bizu"
            },
            "https://www.youtube.com/watch?v=4PO2rFc_4NU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=9&t=0s": {
                "title": "Duke Dumont, Ebenezer - Inhale (Official Video)",
                "channel": "Duke Dumont"
            },
            "https://www.youtube.com/watch?v=4fxPQUKfim4&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=10&t=0s": {
                "title": "The 1975 - TOOTIMETOOTIMETOOTIME",
                "channel": "The 1975"
            },
            "https://www.youtube.com/watch?v=uKqRAC-JNOM&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=11&t=0s": {
                "title": "Ariana Grande - bloodline (Audio)",
                "channel": "Ariana Grande"
            },
            "https://www.youtube.com/watch?v=8nBFqZppIF0&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=12&t=0s": {
                "title": "Halsey - You should be sad",
                "channel": "Halsey"
            },
            "https://www.youtube.com/watch?v=32ZlqCh4jV8&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=13&t=0s": {
                "title": "Yello - Out Of Sight (Official Video)",
                "channel": "YelloVEVO"
            }
        }`);

        const unshuffled = queue.videos;
        queue.shuffle = true;
        const shuffled = queue.videos;

        assert.notDeepStrictEqual(unshuffled, shuffled);
    });

    it("Should shuffle queue", () => {
        const queue = new classes.NewQueue();

        queue.shuffle = true;

        queue.addVideosCombo(`RMPLYLST{
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s": {
                "title": "Robbie Williams - Rock DJ",
                "channel": "Robbie Williams"
            },
            "https://www.youtube.com/watch?v=yC8SPG2LwSA&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=3&t=0s": {
                "title": "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]",
                "channel": "Clean Bandit"
            },
            "https://www.youtube.com/watch?v=nsDwItoNlLc&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=5&t=0s": {
                "title": "Tinie Tempah ft. Jess Glynne - Not Letting Go (Official Video)",
                "channel": "Tinie"
            },
            "https://www.youtube.com/watch?v=jzAv69sh_-4&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=6&t=0s": {
                "title": "The Fear",
                "channel": "Lily Allen"
            }
        }`);

        queue.nextVideo();
        queue.nextVideo();
        const video = queue.nextVideo();

        queue.shuffle = false;

        assert.deepStrictEqual(queue.videos[queue.currentIndex], video);
    });

    it("Should remove cyclic references", () => {
        const queue = new classes.NewQueue();
        queue.addVideosCombo(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );
        queue.nextVideo();

        const nonCyclicQueue = JSON.parse(
            JSON.stringify(queue, queue.cyclicReplacer)
        );
        assert.strictEqual(nonCyclicQueue._currentVideo, undefined);
    });
});

// Test State object
describe("State object tests", () => {
    it("Test update state, expect state to be updated", () => {
        const state = new classes.State();
        state.updateState(1);
        assert.equal(state.state, 1);
        state.updateState(-1);
        assert.equal(state.state, -1);
    });
    it("Test update preloading, expect preloading to be updated", () => {
        const state = new classes.State();
        state.updatePreloading(false);
        assert.equal(state.preloading, false);
        state.updatePreloading(true);
        assert.equal(state.preloading, true);
    });
    it("Test update entire object, expect object to be updated", () => {
        const state = new classes.State();
        const newState = new classes.State();
        state.updateState(3);
        state.updatePreloading(true);
        newState.updateState(2);
        newState.updatePreloading(false);
        state.updateStatus(newState);
        assert.equal(state.state, 2);
        assert.equal(state.preloading, false);
        // assert.equal(state, newState);
    });
});

// Test Login object
describe("Login object tests", () => {
    it("Test constructor, expect id to be set", () => {
        const id = "test";
        const login = new classes.Login(id);
        assert(login.id, id);
    });
    it("Test constructor, expect name to be set", () => {
        const login = new classes.Login("test", undefined, "nameTest");
        assert(login.name, "nameTest");
    });
    it("Test constructor, expect State object to be created", () => {
        const login = new classes.Login("test");
        assert(login.status, new classes.State());
    });
});

// Room object tests
describe("Room object", () => {
    it("Should create new Queue object", () => {
        const room = new classes.Room();
        assert(room.queue, new classes.NewQueue());
    });
    it("Should create new video object", () => {
        const room = new classes.Room();
        assert(room.currentVideo, new classes.Video());
    });
    it("Should add client to room, valid client id", () => {
        const room = new classes.Room();
        const loginID = "test";
        const login = new classes.Login(loginID);
        room.addClient(login);
        assert(room.clients[loginID], login);
    });
    it("Should throw invalidClient, invalid client id", () => {
        const room = new classes.Room();
        const login = new classes.Login();
        try {
            room.addClient(login); // this should fail
            assert.fail("invalidClient not thrown"); // this throws an AssertionError
        } catch (e) {
            // this catches all errors, those thrown by the function under test
            // and those thrown by assert.fail
            if (e instanceof assert.AssertionError) {
                // bubble up the assertion error
                throw e;
            }
            assert.equal(e, "invalidClient");
        }
    });

    it("Should return clients object without cyclic references", () => {
        const room = testHelpers.roomWithTwoClients();
        const actual = room.clientsWithoutCircularReferences();

        delete room.clients.fakeID1.socket;
        delete room.clients.fakeID2.socket;

        const expected = JSON.parse(JSON.stringify(room.clients));

        assert.deepStrictEqual(actual, expected);
    });

    it("Should return clients in room without circular references", () => {
        const room = testHelpers.roomWithTwoClients();
        const expected = JSON.parse(
            JSON.stringify(room.clients, room.cyclicReplacer)
        );
        const actual = room.clientsWithoutCircularReferences();
        assert.deepStrictEqual(actual, expected);
    });

    it("Should return next video and undefined when queue empty", () => {
        const room = new classes.Room();
        const video = new classes.Video("p47fEXGabaY");
        const queue = room.queue;
        queue.addVideo(video);

        assert.deepStrictEqual(room.playNextInQueue(), video);
        assert.strictEqual(room.playNextInQueue(), undefined);
    });

    it("Should return previous video and undefined when queue at beginning", () => {
        const room = new classes.Room();
        const video = new classes.Video("p47fEXGabaY");
        const video2 = new classes.Video("p47fEXGabaZ");
        const queue = room.queue;
        queue.addVideo(video);
        queue.addVideo(video2);

        room.playNextInQueue();
        room.playNextInQueue();
        assert.deepStrictEqual(room.playPrevInQueue(), video);
        assert.strictEqual(room.playPrevInQueue(), undefined);
    });
});

// Room object tests
describe("Room status checking tests", () => {
    it("Should return true", () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.addClient(login2);
        assert.ok(room.allPreloaded());
    });
    it("Should return false", () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.clients[loginID].status.updatePreloading(true);
        room.addClient(login2);
        assert.equal(room.allPreloaded(), false);
    });
    it("Should return false", () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.clients[loginID].status.updatePreloading(true);
        room.addClient(login2);
        room.clients[loginID2].status.updatePreloading(true);
        assert.equal(room.allPreloaded(), false);
    });
    it("Should remove a client", () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.addClient(login2);
        room.removeClient(login);
        assert.ok(typeof room.clients[login] === "undefined");
    });
});

// Server video tests
describe("Server video tests", () => {
    it("State change should call back", done => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1;
        newServerVideo.onStateChange(newState => {
            done(assert.strictEqual(newState, expected));
        });

        newServerVideo.state = expected;
    });

    it("Should set duration", () => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 5000;

        newServerVideo.duration = expected;

        assert.strictEqual(newServerVideo.duration, expected);
    });

    it("Should set state 1", () => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo.state, expected);
    });
    it("Should set state 2", () => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 2;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        assert.strictEqual(newServerVideo.state, expected);
    });
    it("Should set state 3", () => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 3;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();
        newServerVideo.pauseVideo(true);

        assert.strictEqual(newServerVideo.state, expected);
    });
});

describe("Server video timekeeping", () => {
    const testTimestamp = 5;

    beforeEach(function () {
        this.clock = sinon.useFakeTimers(testTimestamp);
    });

    afterEach(function () {
        this.clock.restore();
    });

    it("Time after 5 seconds", function (done) {
        const video = new classes.ServerVideo();
        const elapsedTime = 5000;
        video.startingTime = new Date().getTime();
        this.clock.tick(elapsedTime);
        done(assert.strictEqual(video.getElapsedTime(), elapsedTime));
    });
    it("Time after 10 seconds", function (done) {
        const video = new classes.ServerVideo();
        const elapsedTime = 10000;
        video.startingTime = new Date().getTime();
        this.clock.tick(elapsedTime);
        done(assert.strictEqual(video.getElapsedTime(), elapsedTime));
    });

    it("Should hold correct pause timestamp", function () {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const duration = 2500;
        const elapsed = 100;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        this.clock.tick(elapsed);

        newServerVideo.pauseVideo();
        assert.strictEqual(
            newServerVideo._pausedSince,
            testTimestamp + elapsed
        );
    });

    it("Should pause the video timer", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1000;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            newServerVideo.playVideo();
            done(
                assert.strictEqual(
                    Math.floor(newServerVideo.pausedTime),
                    expected
                )
            );
        }, expected);

        this.clock.tick(expected);
    });

    it("Should get paused time whilst playing", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1000;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            newServerVideo.playVideo();
            done(
                assert.strictEqual(
                    Math.floor(newServerVideo.pausedTime),
                    expected
                )
            );
        }, expected);

        this.clock.tick(expected);
    });

    it("Should get paused time whilst still paused", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1000;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            done(
                assert.strictEqual(
                    Math.floor(newServerVideo.pausedTime),
                    expected
                )
            );
        }, expected);

        this.clock.tick(expected);
    });

    it("Play delay should call back", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 5;

        newServerVideo.onPlayDelay(newState => {
            done(assert.strictEqual(newState, expected));
        });

        newServerVideo.state = expected;
        this.clock.tick(2000);
    });

    it("Should set the starting time correctly", () => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo.startingTime, testTimestamp);
    });

    it("Should resume the timer correctly", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1000;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        setTimeout(() => {
            newServerVideo.playVideo();
            assert.strictEqual(newServerVideo._pausedTime, expected);
            assert.strictEqual(newServerVideo._pausedSince, 0);
            done();
        }, expected);

        this.clock.tick(expected);
    });

    it("Should set the time remaining correctly", () => {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 2500;
        newServerVideo.duration = expected;

        newServerVideo.playVideo();

        assert.strictEqual(
            newServerVideo._timeRemainingSinceLastResumed,
            expected
        );
    });

    it("Should set the time remaining correctly when time has elapsed", function () {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1500;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();

        this.clock.tick(1000);
        newServerVideo.pauseVideo();
        newServerVideo.playVideo();

        assert.strictEqual(
            newServerVideo._timeRemainingSinceLastResumed,
            expected
        );
    });

    it("Should not call back as not finished", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.whenFinished(() => {
            done(); // This should not be called
        });

        newServerVideo.playVideo();

        this.clock.tick(duration - 100);
        done();
    });

    it("Should call back as finished", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.whenFinished(() => {
            done();
        });

        newServerVideo.playVideo();

        this.clock.tick(duration);
    });

    it("Should not call back as paused", function (done) {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.whenFinished(() => {
            done(); // This should not be called
        });

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        this.clock.tick(duration);
        done();
    });

    // TODO Test: callback when timestamp has been changed

    it("Should get elapsed time", function () {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1000;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();
        this.clock.tick(expected);

        assert.strictEqual(newServerVideo.getElapsedTime(), expected);
    });

    it("Should get elapsed time whilst paused", function () {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 1000;
        const duration = 2500;
        newServerVideo.duration = duration;

        newServerVideo.playVideo();
        this.clock.tick(expected);
        newServerVideo.pauseVideo();
        this.clock.tick(expected); // This should not affect the video's timestamp (it should be paused)

        assert.strictEqual(newServerVideo.getElapsedTime(), expected);
    });

    it("Should get elapsed time as 0", function () {
        const newServerVideo = new classes.ServerVideo("testID", "testTitle");
        const expected = 0;
        const duration = 2500;
        newServerVideo.duration = duration;

        this.clock.tick(expected);

        assert.strictEqual(newServerVideo.getElapsedTime(), expected);
    });
});

// Room object tests
describe("Room client management tests", () => {
    it('Should return ["Name1"]', () => {
        const room = new classes.Room();
        const loginID = "test";
        const login = new classes.Login(loginID);
        login.name = "Name1";
        room.addClient(login);
        const nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["Name1"]);
    });
    it('Should return ["First", "21562"]', () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        login.name = "First";
        login2.name = "21562";
        room.addClient(login);
        room.addClient(login2);
        const nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["First", "21562"]);
    });
    it('Should return ["6172", "Crashed"]', () => {
        const room = new classes.Room();
        const loginID = "test";
        const loginID2 = "anotherTest";
        const login = new classes.Login(loginID);
        const login2 = new classes.Login(loginID2);
        login.name = "6172";
        login2.name = "Crashed";
        room.addClient(login);
        room.addClient(login2);
        const nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["6172", "Crashed"]);
    });
    it("Should set the room event callback", done => {
        const room = new classes.Room();
        room.onRoomEvent(() => {
            done();
        });

        room._cbEvent();
    });

    it("Should set the client event callback", done => {
        const room = new classes.Room();
        room.onClientEvent(() => {
            done();
        });

        room._cbClientEvent();
    });

    it("Should toggle the queue shuffle state", () => {
        const room = new classes.Room();
        const queueShuffle = false;
        room.queue.shuffle = queueShuffle;

        assert.strictEqual(room.queueShuffleToggle(), !queueShuffle);
        assert.strictEqual(room.queueShuffleToggle(), queueShuffle);
    });
});

// Room transport tests
describe("Room transport tests", () => {
    it("Should return correct queue JSON", () => {
        const room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );

        const queueTransportConstruct = room.transportConstructs.queue();
        const expected = {
            videos: room.queue.videos,
            length: 2,
            index: -1,
        };

        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it("Should return correct queue status JSON", () => {
        const room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );

        const queueStatusTransportConstruct = room.transportConstructs.queueStatus();
        const expected = {
            shuffle: room.queue.shuffle,
            length: room.queue.length,
            index: room.queue.currentIndex,
        };

        assert.deepStrictEqual(queueStatusTransportConstruct.data, expected);
    });

    it("Should return current video in room", () => {
        const room = testHelpers.roomWithTwoClients();
        room.currentVideo = new ServerVideo(
            "testID",
            "testTitle",
            "testChannel",
            "testDuration"
        );

        const videoTransportConstruct = room.transportConstructs.currentVideo();
        const expected = JSON.stringify(
            room.currentVideo,
            room.currentVideo.cyclicReplacer
        );

        assert.deepStrictEqual(videoTransportConstruct.data, expected);
    });
});

describe("console.log spies for classes.js", () => {
    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        sandbox.spy(console, "log");
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("Should not set the room's current video's details as invalid video ID", done => {
        const valueOfLogTest =
            "[ServerVideo] Recieved invalid video details from";

        const room = testHelpers.roomWithTwoClients();
        const videoDetails = {
            id: undefined,
            title: "New Title",
            channel: "New Channel",
            duration: 7,
        };

        room.onRoomEvent((data, room) => {
            done(); // This should not be called
        });

        const functionReturnCode = room.incomingEvents.receiverVideoDetails(
            videoDetails,
            room.clients.fakeID1
        );

        assert.notStrictEqual(room.currentVideo.title, videoDetails.title);
        assert.notStrictEqual(room.currentVideo.channel, videoDetails.channel);
        assert.notStrictEqual(
            room.currentVideo.duration,
            videoDetails.duration
        );
        assert.strictEqual(functionReturnCode, 1);

        // assert that it logged the correct value
        assert.ok(console.log.getCall(0).args[0].includes(valueOfLogTest));

        done();
    });

    it("Should log video finishing to the console", () => {
        const valueOfLogTest =
            "[ServerVideo] The video has finished. Elapsed time:";

        const room = new classes.Room();

        room.incomingEvents.videoFinished();

        // assert that it logged the correct value
        assert.ok(console.log.getCall(0).args[0].includes(valueOfLogTest));
    });
});

describe("Room event tests", () => {
    it("Should add a new client to the room", () => {
        const room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );

        const queueTransportConstruct = room.transportConstructs.queue();
        const expected = {
            videos: room.queue.videos,
            length: 2,
            index: -1,
        };

        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it("Should callback with ", () => {
        const room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV(
            "https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw"
        );

        const queueTransportConstruct = room.transportConstructs.queue();
        const expected = {
            videos: room.queue.videos,
            length: 2,
            index: -1,
        };

        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it("Should callback with buffering clients", done => {
        const room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1;

        // Client 1 should be seen as "newly ready"
        room.clients.fakeID1.status.updateState(3);
        room.clients.fakeID1.status.updateState(1);

        const bufferingClients = new event();
        const bufferingClientsConstruct = room.transportConstructs.bufferingClients();
        bufferingClients.addBroadcastEventFromConstruct(
            bufferingClientsConstruct
        );

        room.onRoomEvent((data, room) => {
            done(assert.deepStrictEqual(data, bufferingClients));
        });

        room.broadcastBufferingIfClientNowReady(room.clients.fakeID1.status);
    });

    it("Should not callback with buffering clients", done => {
        const room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1;

        // Client 1 should not be seen as "newly ready"
        room.clients.fakeID1.status.updateState(2);
        room.clients.fakeID1.status.updateState(1);

        room.onRoomEvent((data, room) => {
            done(); // This should not be called
        });

        room.broadcastBufferingIfClientNowReady(room.clients.fakeID1.status);
        done();
    });

    it("Should call back with video play broadcast event", done => {
        const room = new classes.Room();

        const expected = new event("serverPlayerControl", "play");

        room.onRoomEvent((data, room) => {
            assert.deepStrictEqual(data, expected);
            done();
        });
        room.incomingEvents.videoStateChange(1);
    });

    it("Should call back with video pause broadcast event", done => {
        const room = new classes.Room();

        const expected = new event("serverPlayerControl", "pause");

        room.onRoomEvent((data, room) => {
            assert.deepStrictEqual(data, expected);
            done();
        });

        room.incomingEvents.videoStateChange(2);
    });

    it("Should call back with video pause broadcast event", done => {
        const room = new classes.Room();

        const expected = new event("serverPlayerControl", "pause");

        room.onRoomEvent((data, room) => {
            assert.deepStrictEqual(data, expected);
            done();
        });

        room.incomingEvents.videoStateChange(3);
    });

    it("Should not call back as no video control required", done => {
        const room = new classes.Room();

        room.onRoomEvent((data, room) => {
            done(); // Should not be called
        });

        room.incomingEvents.videoStateChange(5);
        done();
    });

    it("Should not call back as no video control required", done => {
        const room = new classes.Room();

        room.onRoomEvent((data, room) => {
            done(); // Should not be called
        });

        room.incomingEvents.videoStateChange(undefined);
        done();
    });

    it("Should start the video playing", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.currentVideo, "playVideo");

        room.currentVideo.duration = 1;

        room.clients.fakeID1.status.updatePreloading(false);
        room.clients.fakeID2.status.updatePreloading(false);

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.calledOnce);

        // restore the original function
        spy.restore();
    });

    it("Should not start the video playing as client preloading", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.currentVideo, "playVideo");

        room.currentVideo.duration = 1;

        room.clients.fakeID1.status.updatePreloading(false);
        room.clients.fakeID2.status.updatePreloading(true);

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    });

    it("Should not start the video playing as no video duration", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.currentVideo, "playVideo");

        room.clients.fakeID1.status.updatePreloading(false);
        room.clients.fakeID2.status.updatePreloading(false);

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    });

    it("Should not start the video playing as no video cued", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.currentVideo, "playVideo");

        room.currentVideo.state = 0;

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    });

    it("Should update the client's preloading status", () => {
        const room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1.status.updatePreloading(true);
        const expected = false;

        room.incomingEvents.receiverPreloadingFinished(
            undefined,
            room.clients.fakeID1
        );

        assert.strictEqual(room.clients.fakeID1.status.preloading, expected);
    });

    it("Should throw as wrong video ID and not update the client's preloading status", () => {
        const room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1.status.updatePreloading(true);
        // assert(false)

        assert.throws(() => {
            room.incomingEvents.receiverPreloadingFinished(
                "wrongVideoID",
                room.clients.fakeID1
            );
        });
    });

    it("Should set the client's nickname in the room", () => {
        const room = testHelpers.roomWithTwoClients();
        const expected = "testNick";

        room.incomingEvents.receiverNickname("testNick", room.clients.fakeID1);

        assert.strictEqual(room.clients.fakeID1.name, expected);
    });

    it("Should return error of duplicate nickname", () => {
        const room = testHelpers.roomWithTwoClients();
        const expected = "testNick";

        room.incomingEvents.receiverNickname("testNick", room.clients.fakeID1);
        const functionReturnValue = room.incomingEvents.receiverNickname(
            "testNick",
            room.clients.fakeID2
        );

        assert.notStrictEqual(room.clients.fakeID2.name, expected);
        assert.strictEqual(functionReturnValue, "Duplicate Nickname Error");
    });

    it("Should callback with the client's new nickname", done => {
        const room = testHelpers.roomWithTwoClients();
        const expected = "testNick";

        room.onRoomEvent((data, room) => {
            const nicknameSetResponse = new event();
            const clients = room.transportConstructs.clients();
            nicknameSetResponse.addBroadcastEventFromConstruct(clients);

            assert.deepStrictEqual(data, nicknameSetResponse);
            assert.strictEqual(
                data.broadcastEvents.serverClients.fakeID1._name,
                expected
            );
            done();
        });

        room.incomingEvents.receiverNickname("testNick", room.clients.fakeID1);
    });

    it("Should update the client's state as being ready but not call back with current video", done => {
        const room = testHelpers.roomWithTwoClients();
        const expectedPlayerLoadingState = false;
        const expectedState = -1;
        const expectedReturnCode = 1;

        room.currentVideo.state = 0;

        room.onClientEvent((data, room) => {
            done(); // Should not be called
        });

        const functionReturnCode = room.incomingEvents.receiverReady(
            room.clients.fakeID1
        );
        assert.strictEqual(room.clients.fakeID1.status.state, expectedState);
        assert.strictEqual(
            room.clients.fakeID1.status.playerLoading,
            expectedPlayerLoadingState
        );
        assert.strictEqual(functionReturnCode, expectedReturnCode);
        done();
    });

    it("Should update the client's state as being ready and call back with current video", done => {
        const room = testHelpers.roomWithTwoClients();
        const expectedPlayerLoadingState = false;
        const expectedState = -1;
        const expectedRequiresTS = true;

        room.currentVideo.duration = 1;
        room.currentVideo.playVideo();

        room.onClientEvent((data, room, client) => {
            const newPreload = new event();
            const transportNewVideo = room.transportConstructs.newVideo(
                room.currentVideo
            );
            newPreload.addSendEventFromConstruct(transportNewVideo);
            assert.deepStrictEqual(data, newPreload);
            assert.deepStrictEqual(client, room.clients.fakeID1); // Ensure the correct client object has been passed through

            assert.strictEqual(
                room.clients.fakeID1.status.state,
                expectedState
            );
            assert.strictEqual(
                room.clients.fakeID1.status.playerLoading,
                expectedPlayerLoadingState
            );
            // console.log(JSON.stringify(room.clients.fakeID1))
            // TODO Test: Look into why this doesn't work
            // assert.strictEqual(room.clients.fakeID1.status.requiresTimestamp, expectedRequiresTS);
            done();
        });

        room.incomingEvents.receiverReady(room.clients.fakeID1);
    });

    it("Should update the client's state as being ready and call back with current video", done => {
        const room = testHelpers.roomWithTwoClients();
        const expectedPlayerLoadingState = false;
        const expectedState = -1;
        const expectedRequiresTS = true;

        room.onClientEvent((data, room, client) => {
            const newPreload = new event();
            const transportNewVideo = room.transportConstructs.newVideo(
                room.currentVideo
            );
            newPreload.addSendEventFromConstruct(transportNewVideo);
            assert.deepStrictEqual(data, newPreload);
            assert.deepStrictEqual(client, room.clients.fakeID1); // Ensure the correct client object has been passed through

            assert.strictEqual(
                room.clients.fakeID1.status.state,
                expectedState
            );
            assert.strictEqual(
                room.clients.fakeID1.status.playerLoading,
                expectedPlayerLoadingState
            );
            // console.log(JSON.stringify(room.clients.fakeID1))
            // TODO Test: Look into why this doesn't work
            // assert.strictEqual(room.clients.fakeID1.status.requiresTimestamp, expectedRequiresTS);
            done();
        });

        room.incomingEvents.receiverReady(room.clients.fakeID1);
    });

    it("Should callback with error as invalid video id", done => {
        const room = testHelpers.roomWithTwoClients();
        const expected = {
            timestamp: 5,
            videoID: "invalid",
        };

        room.onNotClientEvent((data, room) => {
            assert.strictEqual(
                data.broadcastEvents.serverVideoTimestamp,
                expected
            );
            done();
        });

        room.incomingEvents.newTimestamp(expected, new Login(), error => {
            assert.ok(error);
            done();
        });
    });

    it("Should set the room's current video's details and call back", done => {
        const room = testHelpers.roomWithTwoClients();
        const videoDetails = {
            id: undefined,
            title: "New Title",
            channel: "New Channel",
            duration: 7,
        };

        room.onRoomEvent((data, room) => {
            const videoDetailsEvent = new event();
            const video = room.transportConstructs.currentVideo();
            videoDetailsEvent.addBroadcastEventFromConstruct(video);

            assert.deepStrictEqual(data, videoDetailsEvent);
            assert.strictEqual(room.currentVideo.title, videoDetails.title);
            assert.strictEqual(room.currentVideo.channel, videoDetails.channel);
            assert.strictEqual(
                room.currentVideo.duration,
                videoDetails.duration
            );
            done();
        });

        room.incomingEvents.receiverVideoDetails(
            videoDetails,
            room.clients.fakeID1
        );
    });

    it("Should pause the video", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.currentVideo, "pauseVideo");

        room.incomingEvents.videoControl("pause");

        // Should have been called with false as not bufering
        assert.ok(spy.calledOnce);
        assert.strictEqual(spy.getCall(0).args[0], false);

        // restore the original function
        spy.restore();
    });

    it("Should play the video", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.currentVideo, "playVideo");

        room.incomingEvents.videoControl("play");

        // Should have been called once
        assert.ok(spy.calledOnce);

        // restore the original function
        spy.restore();
    });

    // it('Should play the video', function () {
    //     let room = testHelpers.roomWithTwoClients();
    //     let pauseSpy = sinon.spy(room.currentVideo, "pauseVideo");
    //     let playSpy = sinon.spy(room.currentVideo, "playVideo");

    //     room.events.videoControl("garbage");

    //     // Should have been called once
    //     assert.ok(pauseSpy.notCalled);
    //     assert.ok(playSpy.notCalled);

    //     // restore the original functions
    //     pauseSpy.restore();
    //     playSpy.restore();
    // })

    it("Should preload a new video", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room, "preloadNewVideoInRoom");
        const videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8";
        const videoID = "FoSe_KAQEr8";

        room.incomingEvents.newVideo(videoURL);

        const expectedVideo = new Video(videoID);

        // Should have been called once
        assert.ok(spy.calledOnce);
        assert.deepStrictEqual(spy.getCall(0).args[0], expectedVideo);

        // restore the original function
        spy.restore();
    });

    it("Should do nothing as multiple video URLs in argument", () => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room, "preloadNewVideoInRoom");
        const videoURL =
            "https://www.youtube.com/watch?v=FoSe_KAQEr8,https://www.youtube.com/watch?v=FoSe_KAQEr8";
        const videoID = "FoSe_KAQEr8";

        room.incomingEvents.newVideo(videoURL);

        // Should have been called once
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    });

    it("Should append to the queue and call back", done => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.queue, "addVideosCombo");
        const videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8";
        const videoID = "FoSe_KAQEr8";

        room.onRoomEvent((data, room) => {
            const queueAppendResponse = new event();
            const queue = room.transportConstructs.queue();
            queueAppendResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueAppendResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);
            assert.deepStrictEqual(spy.getCall(0).args[0], videoURL);

            // restore the original function
            spy.restore();
            done();
        });

        room.incomingEvents.queueAppend(videoURL);
    });

    it("Should play the previous item in the queue and call back with the queue", done => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room, "playPrevInQueue");

        room.onRoomEvent((data, room) => {
            const queueControlResponse = new event();
            const queueStatus = room.transportConstructs.queueStatus();
            queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        });

        room.incomingEvents.queueControl("prev");
    });

    it("Should play the next item in the queue and call back with the queue", done => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room, "playNextInQueue");

        room.onRoomEvent((data, room) => {
            const queueControlResponse = new event();
            const queueStatus = room.transportConstructs.queueStatus();
            queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        });

        room.incomingEvents.queueControl("skip");
    });

    it("Should empty the queue and call back with the queue", done => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room.queue, "empty");

        room.onRoomEvent((data, room) => {
            const queueControlResponse = new event();
            const queue = room.transportConstructs.queue();
            queueControlResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        });

        room.incomingEvents.queueControl("empty");
    });

    it("Should toggle shuffle on the queue and call back with the queue", done => {
        const room = testHelpers.roomWithTwoClients();
        const spy = sinon.spy(room, "queueShuffleToggle");

        room.onRoomEvent((data, room) => {
            const queueControlResponse = new event();
            const queue = room.transportConstructs.queue();
            const queueStatus = room.transportConstructs.queueStatus();
            queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
            queueControlResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        });

        room.incomingEvents.queueControl("toggleShuffle");
    });

    it("Should only call back with the queue", done => {
        const room = testHelpers.roomWithTwoClients();
        const spyQueueShuffle = sinon.spy(room, "queueShuffleToggle");
        const spyQueueEmpty = sinon.spy(room.queue, "empty");
        const spyQueuePrev = sinon.spy(room, "playPrevInQueue");
        const spyQueueNext = sinon.spy(room, "playNextInQueue");

        room.onRoomEvent((data, room) => {
            const queueControlResponse = new event();
            const queue = room.transportConstructs.queue();
            queueControlResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should not have been called
            assert.ok(spyQueueShuffle.notCalled);
            assert.ok(spyQueueEmpty.notCalled);
            assert.ok(spyQueuePrev.notCalled);
            assert.ok(spyQueueNext.notCalled);

            // restore the original function
            spyQueueShuffle.restore();
            spyQueueEmpty.restore();
            spyQueuePrev.restore();
            spyQueueNext.restore();
            done();
        });

        room.incomingEvents.queueControl("garbage");
    });

    it("Should call back with the new client list", done => {
        const room = testHelpers.roomWithTwoClients();

        room.onRoomEvent(function (data, room) {
            const removeClientResponse = new event();
            const clients = this.transportConstructs.clients();
            removeClientResponse.addBroadcastEventFromConstruct(clients);
            assert.deepStrictEqual(data, removeClientResponse);

            done();
        });
        // TODO Test: more thoroughly
        room.incomingEvents.disconnectClient(room.clients.fakeID1);
    });

    it("Should call back with all data including video", done => {
        let room = testHelpers.roomWithTwoClients(),
            newClientResponse = new event(),
            returnedClient;
        // let newClientExpected = new classes.Login("fakeID3", undefined, "fakeName3");
        const socketObjectMock = {
            id: "fakeID3",
        };
        const newClientExpected = new classes.Login(
            socketObjectMock.id,
            socketObjectMock,
            socketObjectMock.id
        );

        room.currentVideo.duration = 1;
        room.currentVideo.playVideo();

        room.onRoomEvent(function (data, room) {
            const queue = this.transportConstructs.queue();
            const queueStatus = this.transportConstructs.queueStatus();
            const video = this.transportConstructs.currentVideo();
            const clients = this.transportConstructs.clients();
            newClientResponse.addBroadcastEventFromConstruct(clients);
            newClientResponse.addSendEventFromConstruct(queue);
            newClientResponse.addSendEventFromConstruct(queueStatus);
            newClientResponse.addSendEventFromConstruct(video);
            newClientResponse.addSendEvent("initFinished", "1");

            assert.deepStrictEqual(data, newClientResponse);
        });

        room.onClientEvent((data, room, client) => {
            assert.deepStrictEqual(data, newClientResponse);
            assert.strictEqual(client.id, newClientExpected.id);
            assert.strictEqual(client._name, newClientExpected._name);
            done();
        });

        returnedClient = room.incomingEvents.newClient(socketObjectMock);
    });

    it("Should return new client and call back with all data", done => {
        let room = testHelpers.roomWithTwoClients(),
            newClientResponse = new event(),
            returnedClient;
        // let newClientExpected = new classes.Login("fakeID3", undefined, "fakeName3");
        const socketObjectMock = {
            id: "fakeID3",
        };
        const newClientExpected = new classes.Login(
            socketObjectMock.id,
            socketObjectMock,
            socketObjectMock.id
        );

        room.onRoomEvent(function (data, room) {
            const queue = this.transportConstructs.queue();
            const queueStatus = this.transportConstructs.queueStatus();
            const clients = this.transportConstructs.clients();
            newClientResponse.addBroadcastEventFromConstruct(clients);
            newClientResponse.addSendEventFromConstruct(queue);
            newClientResponse.addSendEventFromConstruct(queueStatus);
            newClientResponse.addSendEvent("initFinished", "1");

            assert.deepStrictEqual(data, newClientResponse);
        });

        room.onClientEvent((data, room, client) => {
            assert.deepStrictEqual(data, newClientResponse);
            assert.strictEqual(client.id, newClientExpected.id);
            assert.strictEqual(client._name, newClientExpected._name);
            done();
        });

        returnedClient = room.incomingEvents.newClient(socketObjectMock);
    });

    it("Should call back with clients after new status received", done => {
        const room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        const stateJSON = {
            videoID: undefined,
            data: {
                state: 3,
                preloading: false,
                firstVideo: false,
            },
        };

        room.onRoomEvent(function (data, room) {
            const statusResponse = new event();
            const clients = this.transportConstructs.clients();
            statusResponse.addBroadcastEventFromConstruct(clients);

            assert.deepStrictEqual(data, statusResponse);
            done();
        });

        room.incomingEvents.receiverPlayerStatus(
            stateJSON,
            room.clients.fakeID1
        );
    });

    it("Should set the video to state 3", () => {
        const room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        const stateJSON = {
            videoID: undefined,
            data: {
                state: 3,
                preloading: false,
                firstVideo: false,
            },
        };

        room.incomingEvents.receiverPlayerStatus(
            stateJSON,
            room.clients.fakeID1
        );
        assert.strictEqual(room.currentVideo.state, 3);
    });

    it("Should do nothing, invalid client video", () => {
        const room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        const stateJSON = {
            videoID: "wrongID",
            data: {
                state: 3,
                preloading: false,
                firstVideo: false,
            },
        };

        const returnCode = room.incomingEvents.receiverPlayerStatus(
            stateJSON,
            room.clients.fakeID1
        );
        assert.notStrictEqual(room.currentVideo.state, 3);
        assert.strictEqual(returnCode, 1);
    });

    it("Should do nothing, client preloading", () => {
        const room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        const stateJSON = {
            videoID: undefined,
            data: {
                state: 3,
                preloading: true,
                firstVideo: false,
            },
        };

        room.incomingEvents.receiverPlayerStatus(
            stateJSON,
            room.clients.fakeID1
        );
        assert.notStrictEqual(room.currentVideo.state, 3);
    });

    it("Should resume clients", () => {
        const room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        const stateJSON = {
            videoID: undefined,
            data: {
                state: 3,
                preloading: false,
                firstVideo: false,
            },
        };
        const notBufferingStateJSON = {
            videoID: undefined,
            data: {
                state: 1,
                preloading: false,
                firstVideo: false,
            },
        };

        room.incomingEvents.receiverPlayerStatus(
            stateJSON,
            room.clients.fakeID1
        );
        assert.strictEqual(room.currentVideo.state, 3);
        room.incomingEvents.receiverPlayerStatus(
            notBufferingStateJSON,
            room.clients.fakeID1
        );
        assert.strictEqual(room.currentVideo.state, 1);
    });
});

describe("Room time sensitive events", () => {
    const testTimestamp = 5;

    beforeEach(function () {
        this.clock = sinon.useFakeTimers(testTimestamp);
    });

    afterEach(function () {
        this.clock.restore();
    });

    it("Should callback with timestamp for client", done => {
        const room = testHelpers.roomWithTwoClients();

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        room.clients.fakeID1.status.requiresTimestamp = true;

        const timestampForClient = new event();
        timestampForClient.addSendEvent(
            "serverVideoTimestamp",
            room.currentVideo.getElapsedTime()
        );

        room.onClientEvent((data, room, client) => {
            assert.deepStrictEqual(client, room.clients.fakeID1);
            assert.deepStrictEqual(data, timestampForClient);
            done();
        });

        room.sendTimestampIfClientRequires(room.clients.fakeID1);
    });

    it("Should not callback with timestamp for client as video finished", done => {
        const room = testHelpers.roomWithTwoClients();

        room.currentVideo.duration = 1000;
        room.currentVideo.state = 0;

        room.clients.fakeID1.status.requiresTimestamp = true;

        const timestampForClient = new event();
        timestampForClient.addSendEvent(
            "serverVideoTimestamp",
            room.currentVideo.getElapsedTime()
        );

        room.onClientEvent(() => {
            done(); // Should not be called
        });

        room.sendTimestampIfClientRequires(room.clients.fakeID1);
        done();
    });

    it("Should not callback with timestamp for client as not required", done => {
        const room = testHelpers.roomWithTwoClients();

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        room.clients.fakeID1.status.requiresTimestamp = false;

        const timestampForClient = new event();
        timestampForClient.addSendEvent(
            "serverVideoTimestamp",
            room.currentVideo.getElapsedTime()
        );

        room.onClientEvent(() => {
            done(); // Should not be called
        });

        room.sendTimestampIfClientRequires(room.clients.fakeID1);
        done();
    });

    it("Should callback with current timestamp", function (done) {
        const room = testHelpers.roomWithTwoClients();
        const ts = 100;
        const data = {
            videoID: undefined,
        };

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        this.clock.tick(ts);

        room.incomingEvents.currentTimestampRequest(
            data,
            (timestamp, error) => {
                assert.strictEqual(timestamp, ts);
                done();
            }
        );
    });

    it("Should callback with error as invalid ID", function (done) {
        const room = testHelpers.roomWithTwoClients();
        const ts = 100;
        const data = {
            videoID: "invalid",
        };

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        this.clock.tick(ts);

        room.incomingEvents.currentTimestampRequest(
            data,
            (timestamp, error) => {
                assert.ok(error);
                done();
            }
        );
    });
    it("Should callback with the new timestamp", done => {
        const room = testHelpers.roomWithTwoClients();
        const expected = {
            timestamp: 5000,
            videoID: undefined,
        };

        room.onNotClientEvent((data, room) => {
            assert.strictEqual(
                data.broadcastEvents.serverVideoTimestamp,
                expected.timestamp
            );
            done();
        });

        room.incomingEvents.newTimestamp(expected, new Login());
    });
});

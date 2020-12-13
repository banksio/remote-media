const assert = require('assert');
const sinon = require('sinon');

const { event } = require("../web/js/event");

const testHelpers = require('../src/test/setupFunctions');

// Classes
var classes = require('../src/rm/classes');
const { queue } = require('jquery');
const { Video, ServerVideo, Login } = require('../src/rm/classes');

// Test video object ID parsing
describe('Video object URL parsing test', function () {
    let video = new classes.Video();
    beforeEach(function () {
        // video.id = undefined;
    });
    it('Short youtu.be - ID should be p47fEXGabaY', function () {
        video.setIDFromURL("https://youtu.be/p47fEXGabaY");
        assert.equal(video.id, "p47fEXGabaY");
    });
    it('Short youtu.be - ID should be ez1Kv8hiQGU', function () {
        video.setIDFromURL("https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        assert.equal(video.id, "ez1Kv8hiQGU");
    });
    it('Full length link - ID should be UBhdIcb84Hw', function () {
        video.setIDFromURL("https://www.youtube.com/watch?v=UBhdIcb84Hw");
        assert.equal(video.id, "UBhdIcb84Hw");
    });
    it('Full length link with playlist - ID should be UBhdIcb84Hw', function () {
        video.setIDFromURL("https://www.youtube.com/watch?v=xi3c-9qzrPY&list=RDMMEK_LN3XEcnw&index=11");
        assert.equal(video.id, "xi3c-9qzrPY");
    });
    it('Invalid video URL, should return undefined', function () {
        assert.throws(function () { video.setIDFromURL("https://www.youtube.com/playlist?list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG"); });
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
describe('NewQueue tests', function () {
    let video = new classes.Video("p47fEXGabaY");
    let video2 = new classes.Video("vWaRiD5ym74");
    it('Add single video, expect correct video object and queue length', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        assert.strictEqual(queue.length, 1);
        assert.deepStrictEqual(queue.nextVideo(), video);
        assert.strictEqual(queue.length, 0);
    });
    it('Add single video from ID, expect correct video ID and queue length', function () {
        let queue = new classes.NewQueue();
        queue.addVideoFromID(video.id);
        assert.strictEqual(queue.length, 1);
        assert.strictEqual(queue.nextVideo().id, video.id);
        assert.strictEqual(queue.length, 0);
    });
    it('Add two videos from CSV test queue length, ID and pop from queue', function () {
        let queue = new classes.NewQueue();
        queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue.nextVideo().id, "xi3c-9qzrPY");
        assert.strictEqual(queue.length, 1);
        assert.strictEqual(queue.nextVideo().id, "ez1Kv8hiQGU");
        assert.strictEqual(queue.length, 0);
    });
    it('Add one video from CSV, expect nothing added', function () {
        let queue = new classes.NewQueue();
        queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw");
        assert.strictEqual(queue.length, 0);
        assert.throws(queue.nextVideo, undefined);
        assert.strictEqual(queue.length, 0);
    });

    it('Should add playlist JSON', function () {
        let rmPlaylistJSON = `RMPLYLST{
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s": {
                "title": "Robbie Williams - Rock DJ",
                "channel": "Robbie Williams"
            },
            "https://www.youtube.com/watch?v=yC8SPG2LwSA&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=3&t=0s": {
                "title": "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]",
                "channel": "Clean Bandit"
            }
        }`;
        let queue = new classes.NewQueue();
        queue.addVideosCombo(rmPlaylistJSON);
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue.peekNextVideo().id, "BnO3nijfYmU");
        assert.strictEqual(queue.peekNextVideo().title, "Robbie Williams - Rock DJ");
        assert.strictEqual(queue.nextVideo().channel, "Robbie Williams");
        assert.strictEqual(queue.peekNextVideo().id, "yC8SPG2LwSA");
        assert.strictEqual(queue.peekNextVideo().title, "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]");
        assert.strictEqual(queue.peekNextVideo().channel, "Clean Bandit");
    });

    it('Should detect corrupt playlist JSON', function () {
        let rmPlaylistJSON = `RMPLYLST{
            "https://www.youtube.com/watch?v=BnO3nijfYmU&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=2&t=0s": {
                "title": "Robbie Williams - Rock DJ",
                "channel": "Robbie Williams"
            },
            "https://www.youtube.com/watch?v=yC8SPG2LwSA&list=PLJlPsYbof_C4JOCj7JVotCm8HGZewIFoG&index=3&t=0s": {
                "title": "Clean Bandit and Mabel - Tick Tock (feat. 24kGoldn) [Official Video]",
                "channel": "Clean Bandit"
            }`;
        let queue = new classes.NewQueue();
        assert.throws(() => { queue.addVideosCombo(rmPlaylistJSON) });
    });

    it('Should add two videos from CSV', function () {
        let queue = new classes.NewQueue();
        queue.addVideosCombo("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        assert.strictEqual(queue.length, 2);
        assert.strictEqual(queue.nextVideo().id, "xi3c-9qzrPY");
        assert.strictEqual(queue.length, 1);
        assert.strictEqual(queue.nextVideo().id, "ez1Kv8hiQGU");
        assert.strictEqual(queue.length, 0);
    });

    it('Should add single video', function () {
        let queue = new classes.NewQueue();
        queue.addVideosCombo("https://www.youtube.com/watch?v=BnO3nijfYmU");
        assert.strictEqual(queue.length, 1);
        assert.deepStrictEqual(queue.nextVideo().id, "BnO3nijfYmU");
        assert.strictEqual(queue.length, 0);
    });

    it('Should return next video and advance queue', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        assert.deepStrictEqual(queue.nextVideo(), video);
        assert.strictEqual(queue.nextVideo(), undefined);
    });

    it('Should return previous video and change index', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        assert.deepStrictEqual(queue.nextVideo(), video);
        assert.strictEqual(queue.previousVideo(), undefined);  // There should be no previous video, it's the start of the queue
        assert.deepStrictEqual(queue.nextVideo(), video2);
        assert.deepStrictEqual(queue.previousVideo(), video);  // There should now be a previous video
    });

    it('Should return previous video and change index when shuffling', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        queue.shuffle = true;

        let shuffleVideo1 = queue.nextVideo();
        let shuffleVideo2 = queue.nextVideo();

        assert.notDeepStrictEqual(shuffleVideo1, shuffleVideo2);  // These should be different, shuffle is on
        assert.deepStrictEqual(queue.previousVideo(), shuffleVideo1);  // There should be no previous video, it's the start of the queue
    });

    it('Should return previous video and not change index', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);

        queue.nextVideo();
        queue.nextVideo();
        queue.peekPreviousVideo

        assert.deepStrictEqual(queue.peekPreviousVideo(), video);
        assert.deepStrictEqual(queue.previousVideo(), video);  // There should now be a previous video
    });

    it('Should return previous video and not change index when shuffling', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        queue.shuffle = true;

        let shuffleVideo1 = queue.nextVideo();
        let shuffleVideo2 = queue.nextVideo();

        assert.notDeepStrictEqual(shuffleVideo1, shuffleVideo2);  // These should be different, shuffle is on
        assert.deepStrictEqual(queue.peekPreviousVideo(), shuffleVideo1);  // There should be no previous video, it's the start of the queue
        assert.deepStrictEqual(queue.previousVideo(), shuffleVideo1);  // There should be no previous video, it's the start of the queue
    });

    it('Should return next video and not change index', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);

        assert.deepStrictEqual(queue.peekNextVideo(), video);
        assert.deepStrictEqual(queue.nextVideo(), video);  // Should be the same as peek should not have changed the index
    });

    it('Should return next video and not change index when shuffling', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        queue.shuffle = true;

        let shuffleVideo1 = queue.nextVideo();
        let shuffleVideo2 = queue.nextVideo();
        queue.previousVideo();

        assert.notDeepStrictEqual(shuffleVideo1, shuffleVideo2);  // These should be different, shuffle is on
        assert.deepStrictEqual(queue.peekNextVideo(), shuffleVideo2);
        assert.deepStrictEqual(queue.nextVideo(), shuffleVideo2);  // Should be the same as peek should not have changed the index
    });

    it('Should have the same length when shuffled', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.addVideo(video2);
        let expected = 2;

        assert.strictEqual(queue.videos.length, expected);
        queue.shuffle = true;
        assert.strictEqual(queue.videos.length, expected);
    });

    it('Should empty and reset the queue', function () {
        let queue = new classes.NewQueue();
        queue.addVideo(video);
        queue.empty();

        // Check both queues are empty
        assert.strictEqual(queue.videos.length, 0);  // might not be necessary
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
    })

    it('Should shuffle queue', function () {
        let queue = new classes.NewQueue();
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


        let unshuffled = queue.videos;
        queue.shuffle = true;
        let shuffled = queue.videos;

        assert.notDeepStrictEqual(unshuffled, shuffled);
    });

    it('Should shuffle queue', function () {
        let queue = new classes.NewQueue();

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

        queue.nextVideo()
        queue.nextVideo()
        let video = queue.nextVideo()

        queue.shuffle = false;

        assert.deepStrictEqual(queue.videos[queue.currentIndex], video);
    });

    it('Should remove cyclic references', function () {
        let queue = new classes.NewQueue();
        queue.addVideosCombo("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        queue.nextVideo();

        let nonCyclicQueue = JSON.parse(JSON.stringify(queue, queue.cyclicReplacer));
        assert.strictEqual(nonCyclicQueue._currentVideo, undefined);
    });
});

// Test State object
describe('State object tests', function () {
    it('Test update state, expect state to be updated', function () {
        let state = new classes.State();
        state.updateState(1);
        assert.equal(state.state, 1);
        state.updateState(-1);
        assert.equal(state.state, -1);
    });
    it('Test update preloading, expect preloading to be updated', function () {
        let state = new classes.State();
        state.updatePreloading(false);
        assert.equal(state.preloading, false);
        state.updatePreloading(true);
        assert.equal(state.preloading, true);
    });
    it('Test update entire object, expect object to be updated', function () {
        let state = new classes.State();
        let newState = new classes.State();
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
describe('Login object tests', function () {
    it('Test constructor, expect id to be set', function () {
        let id = "test";
        let login = new classes.Login(id);
        assert(login.id, id);
    });
    it('Test constructor, expect name to be set', function () {
        let login = new classes.Login("test", undefined, "nameTest");
        assert(login.name, "nameTest");
    });
    it('Test constructor, expect State object to be created', function () {
        let login = new classes.Login("test");
        assert(login.status, new classes.State());
    });
});

// Room object tests
describe('Room object', function () {
    it('Should create new Queue object', function () {
        let room = new classes.Room();
        assert(room.queue, new classes.NewQueue());
    });
    it('Should create new video object', function () {
        let room = new classes.Room();
        assert(room.currentVideo, new classes.Video());
    });
    it('Should add client to room, valid client id', function () {
        let room = new classes.Room();
        let loginID = "test";
        let login = new classes.Login(loginID);
        room.addClient(login);
        assert(room.clients[loginID], login);
    });
    it('Should throw invalidClient, invalid client id', function () {
        let room = new classes.Room();
        let login = new classes.Login();
        try {
            room.addClient(login); // this should fail
            assert.fail('invalidClient not thrown'); // this throws an AssertionError
        } catch (e) { // this catches all errors, those thrown by the function under test
            // and those thrown by assert.fail
            if (e instanceof assert.AssertionError) {
                // bubble up the assertion error
                throw e;
            }
            assert.equal(e, "invalidClient");
        }
    });

    it('Should return clients object without cyclic references', function () {
        let room = testHelpers.roomWithTwoClients();
        let actual = room.clientsWithoutCircularReferences();

        delete room.clients.fakeID1.socket;
        delete room.clients.fakeID2.socket;

        let expected = JSON.parse(JSON.stringify(room.clients));

        assert.deepStrictEqual(actual, expected)
    });

    it('Should return clients in room without circular references', function () {
        let room = testHelpers.roomWithTwoClients();
        let expected = JSON.parse(JSON.stringify(room.clients, room.cyclicReplacer))
        let actual = room.clientsWithoutCircularReferences();
        assert.deepStrictEqual(actual, expected);
    });

    it('Should return next video and undefined when queue empty', function () {
        let room = new classes.Room();
        let video = new classes.Video("p47fEXGabaY");
        let queue = room.queue;
        queue.addVideo(video);

        assert.deepStrictEqual(room.playNextInQueue(), video);
        assert.strictEqual(room.playNextInQueue(), undefined);
    });

    it('Should return previous video and undefined when queue at beginning', function () {
        let room = new classes.Room();
        let video = new classes.Video("p47fEXGabaY");
        let video2 = new classes.Video("p47fEXGabaZ");
        let queue = room.queue;
        queue.addVideo(video);
        queue.addVideo(video2);

        room.playNextInQueue();
        room.playNextInQueue();
        assert.deepStrictEqual(room.playPrevInQueue(), video);
        assert.strictEqual(room.playPrevInQueue(), undefined);
    });
});

// Room object tests
describe('Room status checking tests', function () {
    it('Should return true', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.addClient(login2);
        assert.ok(room.allPreloaded());
    });
    it('Should return false', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.clients[loginID].status.updatePreloading(true);
        room.addClient(login2);
        assert.equal(room.allPreloaded(), false);
    });
    it('Should return false', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.clients[loginID].status.updatePreloading(true);
        room.addClient(login2);
        room.clients[loginID2].status.updatePreloading(true);
        assert.equal(room.allPreloaded(), false);
    });
    it('Should remove a client', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        room.addClient(login);
        room.addClient(login2);
        room.removeClient(login);
        assert.ok(typeof room.clients[login] == "undefined");
    });
});

// Server video tests
describe('Server video tests', function () {
    it('State change should call back', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1;
        newServerVideo.onStateChange((newState) => {
            done(assert.strictEqual(newState, expected));
        })

        newServerVideo.state = expected;
    })


    it('Should set duration', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 5000;

        newServerVideo.duration = (expected);

        assert.strictEqual(newServerVideo.duration, expected)
    })

    it('Should set state 1', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo.state, expected)
    })
    it('Should set state 2', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 2;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        assert.strictEqual(newServerVideo.state, expected)
    })
    it('Should set state 3', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 3;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();
        newServerVideo.pauseVideo(true);

        assert.strictEqual(newServerVideo.state, expected)
    })
});

describe('Server video timekeeping', function () {
    const testTimestamp = 5;

    beforeEach(function () {
        this.clock = sinon.useFakeTimers(testTimestamp);
    })

    afterEach(function () {
        this.clock.restore();
    })

    it('Time after 5 seconds', function (done) {
        let video = new classes.ServerVideo();
        let elapsedTime = 5000;
        video.startingTime = new Date().getTime();
        this.clock.tick(elapsedTime);
        done(assert.strictEqual(video.getElapsedTime(), elapsedTime));
    });
    it('Time after 10 seconds', function (done) {
        let video = new classes.ServerVideo();
        let elapsedTime = 10000;
        video.startingTime = new Date().getTime();
        this.clock.tick(elapsedTime);
        done(assert.strictEqual(video.getElapsedTime(), elapsedTime));
    });

    it('Should hold correct pause timestamp', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        let elapsed = 100;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        this.clock.tick(elapsed);

        newServerVideo.pauseVideo();
        assert.strictEqual(newServerVideo._pausedSince, testTimestamp + elapsed);
    })

    it('Should pause the video timer', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            newServerVideo.playVideo();
            done(assert.strictEqual(Math.floor(newServerVideo.pausedTime), expected));
        }, expected);

        this.clock.tick(expected);
    })


    it('Should get paused time whilst playing', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            newServerVideo.playVideo();
            done(assert.strictEqual(Math.floor(newServerVideo.pausedTime), expected));
        }, expected);

        this.clock.tick(expected);
    })

    it('Should get paused time whilst still paused', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            done(assert.strictEqual(Math.floor(newServerVideo.pausedTime), expected));
        }, expected);

        this.clock.tick(expected);
    })

    it('Play delay should call back', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 5;

        newServerVideo.onPlayDelay((newState) => {
            done(assert.strictEqual(newState, expected));
        })

        newServerVideo.state = expected;
        this.clock.tick(2000);
    })

    it('Should set the starting time correctly', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo.startingTime, testTimestamp);
    })

    it('Should resume the timer correctly', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        setTimeout(() => {
            newServerVideo.playVideo();
            assert.strictEqual(newServerVideo._pausedTime, expected);
            assert.strictEqual(newServerVideo._pausedSince, 0);
            done();
        }, expected);

        this.clock.tick(expected);
    })

    it('Should set the time remaining correctly', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 2500;
        newServerVideo.duration = (expected);

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo._timeRemainingSinceLastResumed, expected);
    })

    it('Should set the time remaining correctly when time has elapsed', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1500;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();

        this.clock.tick(1000);
        newServerVideo.pauseVideo();
        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo._timeRemainingSinceLastResumed, expected);
    })

    it('Should not call back as not finished', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.whenFinished(function () {
            done();  // This should not be called
        })

        newServerVideo.playVideo();

        this.clock.tick(duration - 100);
        done();
    })

    it('Should call back as finished', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.whenFinished(function () {
            done();
        })

        newServerVideo.playVideo();

        this.clock.tick(duration);
    })

    it('Should not call back as paused', function (done) {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.whenFinished(function () {
            done();  // This should not be called
        })

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        this.clock.tick(duration);
        done();
    })

    // TODO Test: callback when timestamp has been changed

    it('Should get elapsed time', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();
        this.clock.tick(expected);

        assert.strictEqual(newServerVideo.getElapsedTime(), expected);
    })

    it('Should get elapsed time whilst paused', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration);

        newServerVideo.playVideo();
        this.clock.tick(expected);
        newServerVideo.pauseVideo();
        this.clock.tick(expected);  // This should not affect the video's timestamp (it should be paused)

        assert.strictEqual(newServerVideo.getElapsedTime(), expected);
    })

    it('Should get elapsed time as 0', function () {
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 0;
        let duration = 2500;
        newServerVideo.duration = (duration);

        this.clock.tick(expected);

        assert.strictEqual(newServerVideo.getElapsedTime(), expected);
    })
});

// Room object tests
describe('Room client management tests', function () {
    it('Should return ["Name1"]', function () {
        let room = new classes.Room();
        let loginID = "test";
        let login = new classes.Login(loginID);
        login.name = "Name1";
        room.addClient(login);
        let nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["Name1"]);
    });
    it('Should return ["First", "21562"]', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "First";
        login2.name = "21562";
        room.addClient(login);
        room.addClient(login2);
        let nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["First", "21562"]);
    });
    it('Should return ["6172", "Crashed"]', function () {
        let room = new classes.Room();
        let loginID = "test";
        let loginID2 = "anotherTest";
        let login = new classes.Login(loginID);
        let login2 = new classes.Login(loginID2);
        login.name = "6172";
        login2.name = "Crashed";
        room.addClient(login);
        room.addClient(login2);
        let nameArray = room.getAllClientNames();
        assert.deepEqual(nameArray, ["6172", "Crashed"]);
    });
    it('Should set the room event callback', function (done) {
        let room = new classes.Room();
        room.onRoomEvent(function () {
            done();
        })

        room._cbEvent();
    })

    it('Should set the client event callback', function (done) {
        let room = new classes.Room();
        room.onClientEvent(function () {
            done();
        })

        room._cbClientEvent();
    })

    it('Should toggle the queue shuffle state', function () {
        let room = new classes.Room();
        let queueShuffle = false;
        room.queue.shuffle = queueShuffle;

        assert.strictEqual(room.queueShuffleToggle(), !queueShuffle);
        assert.strictEqual(room.queueShuffleToggle(), queueShuffle);
    })
});


// Room transport tests
describe('Room transport tests', function () {
    it('Should return correct queue JSON', function () {
        let room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");

        let queueTransportConstruct = room.transportConstructs.queue();
        let expected = {
            "videos": room.queue.videos,
            "length": 2,
            "index": -1
        }

        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it('Should return correct queue status JSON', function () {
        let room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");

        let queueStatusTransportConstruct = room.transportConstructs.queueStatus();
        let expected = {
            "shuffle": room.queue.shuffle,
            "length": room.queue.length,
            "index": room.queue.currentIndex
        }

        assert.deepStrictEqual(queueStatusTransportConstruct.data, expected);
    });

    it('Should return current video in room', function () {
        let room = testHelpers.roomWithTwoClients();
        room.currentVideo = new ServerVideo("testID", "testTitle", "testChannel", "testDuration");

        let videoTransportConstruct = room.transportConstructs.currentVideo();
        let expected = JSON.stringify(room.currentVideo, room.currentVideo.cyclicReplacer);

        assert.deepStrictEqual(videoTransportConstruct.data, expected);
    });
});

describe('console.log spies for classes.js', function (){
    const sandbox = sinon.createSandbox();

    beforeEach(function() {
        sandbox.spy(console, 'log');
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('Should not set the room\'s current video\'s details as invalid video ID', function (done){
        let valueOfLogTest = "[ServerVideo] Recieved invalid video details from";

        let room = testHelpers.roomWithTwoClients();
        let videoDetails = {
            id: undefined,
            title: "New Title",
            channel: "New Channel",
            duration: 7
        }

        room.onRoomEvent(function (data, room) {
            done();  // This should not be called
        })

        let functionReturnCode = room.incomingEvents.receiverVideoDetails(videoDetails, room.clients.fakeID1);

        assert.notStrictEqual(room.currentVideo.title, videoDetails.title);
        assert.notStrictEqual(room.currentVideo.channel, videoDetails.channel);
        assert.notStrictEqual(room.currentVideo.duration, videoDetails.duration);
        assert.strictEqual(functionReturnCode, 1);
        
        // assert that it logged the correct value
        assert.ok(console.log.getCall(0).args[0].includes(valueOfLogTest));

        done();
    });

    it('Should log video finishing to the console', function () {
        let valueOfLogTest = "[ServerVideo] The video has finished. Elapsed time:";

        let room = new classes.Room();

        room.incomingEvents.videoFinished();

        // assert that it logged the correct value
        assert.ok(console.log.getCall(0).args[0].includes(valueOfLogTest));
    });
})

describe('Room event tests', function () {
    it('Should add a new client to the room', function () {
        let room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");

        let queueTransportConstruct = room.transportConstructs.queue();
        let expected = {
            "videos": room.queue.videos,
            "length": 2,
            "index": -1
        }

        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it('Should callback with ', function () {
        let room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");

        let queueTransportConstruct = room.transportConstructs.queue();
        let expected = {
            "videos": room.queue.videos,
            "length": 2,
            "index": -1
        }

        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it('Should callback with buffering clients', function (done) {
        let room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1;

        // Client 1 should be seen as "newly ready"
        room.clients.fakeID1.status.updateState(3);
        room.clients.fakeID1.status.updateState(1);

        let bufferingClients = new event();
        let bufferingClientsConstruct = room.transportConstructs.bufferingClients()
        bufferingClients.addBroadcastEventFromConstruct(bufferingClientsConstruct);

        room.onRoomEvent(function (data, room) {
            done(assert.deepStrictEqual(data, bufferingClients));
        })

        room.broadcastBufferingIfClientNowReady(room.clients.fakeID1.status);
    });

    it('Should not callback with buffering clients', function (done) {
        let room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1;

        // Client 1 should not be seen as "newly ready"
        room.clients.fakeID1.status.updateState(2);
        room.clients.fakeID1.status.updateState(1);

        room.onRoomEvent(function (data, room) {
            done();  // This should not be called
        })

        room.broadcastBufferingIfClientNowReady(room.clients.fakeID1.status);
        done();
    });

    it('Should call back with video play broadcast event', function (done) {
        let room = new classes.Room();

        let expected = new event("serverPlayerControl", "play");

        room.onRoomEvent(function (data, room) {
            assert.deepStrictEqual(data, expected);
            done();
        })
        room.incomingEvents.videoStateChange(1);
    })

    it('Should call back with video pause broadcast event', function (done) {
        let room = new classes.Room();

        let expected = new event("serverPlayerControl", "pause");

        room.onRoomEvent(function (data, room) {
            assert.deepStrictEqual(data, expected);
            done();
        })

        room.incomingEvents.videoStateChange(2);
    })

    it('Should call back with video pause broadcast event', function (done) {
        let room = new classes.Room();

        let expected = new event("serverPlayerControl", "pause");

        room.onRoomEvent(function (data, room) {
            assert.deepStrictEqual(data, expected);
            done();
        })

        room.incomingEvents.videoStateChange(3);
    })

    it('Should not call back as no video control required', function (done) {
        let room = new classes.Room();

        room.onRoomEvent(function (data, room) {
            done();  // Should not be called
        })

        room.incomingEvents.videoStateChange(5);
        done();
    })

    it('Should not call back as no video control required', function (done) {
        let room = new classes.Room();

        room.onRoomEvent(function (data, room) {
            done();  // Should not be called
        })

        room.incomingEvents.videoStateChange(undefined);
        done();
    })

    it('Should start the video playing', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.currentVideo, "playVideo");

        room.currentVideo.duration = 1;

        room.clients.fakeID1.status.updatePreloading(false);
        room.clients.fakeID2.status.updatePreloading(false);

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.calledOnce);

        // restore the original function
        spy.restore();
    })

    it('Should not start the video playing as client preloading', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.currentVideo, "playVideo");

        room.currentVideo.duration = 1;

        room.clients.fakeID1.status.updatePreloading(false);
        room.clients.fakeID2.status.updatePreloading(true);

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    })

    it('Should not start the video playing as no video duration', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.currentVideo, "playVideo");

        room.clients.fakeID1.status.updatePreloading(false);
        room.clients.fakeID2.status.updatePreloading(false);

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    })

    it('Should not start the video playing as no video cued', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.currentVideo, "playVideo");

        room.currentVideo.state = 0;

        room.playIfPreloadingFinished();

        // assert that it was called
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    })

    it('Should update the client\'s preloading status', function () {
        let room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1.status.updatePreloading(true);
        let expected = false;

        room.incomingEvents.receiverPreloadingFinished(undefined, room.clients.fakeID1);

        assert.strictEqual(room.clients.fakeID1.status.preloading, expected);
    });

    it('Should throw as wrong video ID and not update the client\'s preloading status', function () {
        let room = testHelpers.roomWithTwoClients();
        room.clients.fakeID1.status.updatePreloading(true);
        // assert(false)

        assert.throws(() => { room.incomingEvents.receiverPreloadingFinished("wrongVideoID", room.clients.fakeID1) });
    });

    it('Should set the client\'s nickname in the room', function (){
        let room = testHelpers.roomWithTwoClients();
        let expected = "testNick";

        room.incomingEvents.receiverNickname("testNick", room.clients.fakeID1);

        assert.strictEqual(room.clients.fakeID1.name, expected);
    });

    it('Should return error of duplicate nickname', function (){
        let room = testHelpers.roomWithTwoClients();
        let expected = "testNick";

        room.incomingEvents.receiverNickname("testNick", room.clients.fakeID1);
        let functionReturnValue = room.incomingEvents.receiverNickname("testNick", room.clients.fakeID2);

        assert.notStrictEqual(room.clients.fakeID2.name, expected);
        assert.strictEqual(functionReturnValue, "Duplicate Nickname Error");
    });

    it('Should callback with the client\'s new nickname', function (done){
        let room = testHelpers.roomWithTwoClients();
        let expected = "testNick";

        room.onRoomEvent(function (data, room) {
            var nicknameSetResponse = new event();
            let clients = room.transportConstructs.clients();
            nicknameSetResponse.addBroadcastEventFromConstruct(clients);

            assert.deepStrictEqual(data, nicknameSetResponse);
            assert.strictEqual(data.broadcastEvents.serverClients.fakeID1._name, expected);
            done();
        })

        room.incomingEvents.receiverNickname("testNick", room.clients.fakeID1);
    });

    it('Should update the client\'s state as being ready but not call back with current video', function (done){
        let room = testHelpers.roomWithTwoClients();
        let expectedPlayerLoadingState = false;
        let expectedState = -1;
        let expectedReturnCode = 1;

        room.currentVideo.state = 0;

        room.onClientEvent(function (data, room) {
            done();  // Should not be called
        })

        let functionReturnCode = room.incomingEvents.receiverReady(room.clients.fakeID1);
        assert.strictEqual(room.clients.fakeID1.status.state, expectedState);
        assert.strictEqual(room.clients.fakeID1.status.playerLoading, expectedPlayerLoadingState);
        assert.strictEqual(functionReturnCode, expectedReturnCode);
        done();
    });

    it('Should update the client\'s state as being ready and call back with current video', function (done){
        let room = testHelpers.roomWithTwoClients();
        let expectedPlayerLoadingState = false;
        let expectedState = -1;
        let expectedRequiresTS = true;

        room.currentVideo.duration = 1;
        room.currentVideo.playVideo();

        room.onClientEvent(function (data, room, client) {
            let newPreload = new event();
            let transportNewVideo = room.transportConstructs.newVideo(room.currentVideo);
            newPreload.addSendEventFromConstruct(transportNewVideo);
            assert.deepStrictEqual(data, newPreload);
            assert.deepStrictEqual(client, room.clients.fakeID1);  // Ensure the correct client object has been passed through
            
            assert.strictEqual(room.clients.fakeID1.status.state, expectedState);
            assert.strictEqual(room.clients.fakeID1.status.playerLoading, expectedPlayerLoadingState);
            // console.log(JSON.stringify(room.clients.fakeID1))
            // TODO Test: Look into why this doesn't work
            // assert.strictEqual(room.clients.fakeID1.status.requiresTimestamp, expectedRequiresTS);
            done();
        })

        room.incomingEvents.receiverReady(room.clients.fakeID1);
    });

    it('Should update the client\'s state as being ready and call back with current video', function (done){
        let room = testHelpers.roomWithTwoClients();
        let expectedPlayerLoadingState = false;
        let expectedState = -1;
        let expectedRequiresTS = true;


        room.onClientEvent(function (data, room, client) {
            let newPreload = new event();
            let transportNewVideo = room.transportConstructs.newVideo(room.currentVideo);
            newPreload.addSendEventFromConstruct(transportNewVideo);
            assert.deepStrictEqual(data, newPreload);
            assert.deepStrictEqual(client, room.clients.fakeID1);  // Ensure the correct client object has been passed through
            
            assert.strictEqual(room.clients.fakeID1.status.state, expectedState);
            assert.strictEqual(room.clients.fakeID1.status.playerLoading, expectedPlayerLoadingState);
            // console.log(JSON.stringify(room.clients.fakeID1))
            // TODO Test: Look into why this doesn't work
            // assert.strictEqual(room.clients.fakeID1.status.requiresTimestamp, expectedRequiresTS);
            done();
        })

        room.incomingEvents.receiverReady(room.clients.fakeID1);
    });

    it('Should callback with error as invalid video id', function (done){
        let room = testHelpers.roomWithTwoClients();
        let expected = {
            timestamp: 5,
            videoID: "invalid"
        };

        room.onNotClientEvent(function (data, room) {
            assert.strictEqual(data.broadcastEvents.serverVideoTimestamp, expected);
            done();
        })

        room.incomingEvents.newTimestamp(expected, new Login(), function(error){
            assert.ok(error);
            done();
        });
    });

    it('Should set the room\'s current video\'s details and call back', function (done){
        let room = testHelpers.roomWithTwoClients();
        let videoDetails = {
            id: undefined,
            title: "New Title",
            channel: "New Channel",
            duration: 7
        }

        room.onRoomEvent(function (data, room) {
            var videoDetailsEvent = new event();
            let video = room.transportConstructs.currentVideo();
            videoDetailsEvent.addBroadcastEventFromConstruct(video);

            assert.deepStrictEqual(data, videoDetailsEvent);
            assert.strictEqual(room.currentVideo.title, videoDetails.title);
            assert.strictEqual(room.currentVideo.channel, videoDetails.channel);
            assert.strictEqual(room.currentVideo.duration, videoDetails.duration);
            done();
        })

        room.incomingEvents.receiverVideoDetails(videoDetails, room.clients.fakeID1);
    });

    it('Should pause the video', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.currentVideo, "pauseVideo");

        room.incomingEvents.videoControl("pause");

        // Should have been called with false as not bufering
        assert.ok(spy.calledOnce);
        assert.strictEqual(spy.getCall(0).args[0], false);

        // restore the original function
        spy.restore();
    })

    it('Should play the video', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.currentVideo, "playVideo");

        room.incomingEvents.videoControl("play");

        // Should have been called once
        assert.ok(spy.calledOnce);

        // restore the original function
        spy.restore();
    })

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

    it('Should preload a new video', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room, "preloadNewVideoInRoom");
        let videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8";
        let videoID = "FoSe_KAQEr8";

        room.incomingEvents.newVideo(videoURL);

        let expectedVideo = new Video(videoID);

        // Should have been called once
        assert.ok(spy.calledOnce);
        assert.deepStrictEqual(spy.getCall(0).args[0], expectedVideo);

        // restore the original function
        spy.restore();
    })

    it('Should do nothing as multiple video URLs in argument', function () {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room, "preloadNewVideoInRoom");
        let videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8,https://www.youtube.com/watch?v=FoSe_KAQEr8";
        let videoID = "FoSe_KAQEr8";

        room.incomingEvents.newVideo(videoURL);

        // Should have been called once
        assert.ok(spy.notCalled);

        // restore the original function
        spy.restore();
    })

    it('Should append to the queue and call back', function (done) {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.queue, "addVideosCombo");
        let videoURL = "https://www.youtube.com/watch?v=FoSe_KAQEr8";
        let videoID = "FoSe_KAQEr8";

        room.onRoomEvent(function (data, room) {
            let queueAppendResponse = new event();
            let queue = room.transportConstructs.queue();
            queueAppendResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueAppendResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);
            assert.deepStrictEqual(spy.getCall(0).args[0], videoURL);

            // restore the original function
            spy.restore();
            done();
        })

        room.incomingEvents.queueAppend(videoURL);
    })

    it('Should play the previous item in the queue and call back with the queue', function (done) {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room, "playPrevInQueue");

        room.onRoomEvent(function (data, room) {
            var queueControlResponse = new event();
            let queueStatus = room.transportConstructs.queueStatus();
            queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        })

        room.incomingEvents.queueControl("prev");
    })

    it('Should play the next item in the queue and call back with the queue', function (done) {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room, "playNextInQueue");

        room.onRoomEvent(function (data, room) {
            var queueControlResponse = new event();
            let queueStatus = room.transportConstructs.queueStatus();
            queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
            assert.deepStrictEqual(data, queueControlResponse);
            
            // Should have been called once
            assert.ok(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        })

        room.incomingEvents.queueControl("skip");

    })

    it('Should empty the queue and call back with the queue', function (done) {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room.queue, "empty");

        room.onRoomEvent(function (data, room) {
            var queueControlResponse = new event();
            let queue = room.transportConstructs.queue();
            queueControlResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        })

        room.incomingEvents.queueControl("empty");
    })

    it('Should toggle shuffle on the queue and call back with the queue', function (done) {
        let room = testHelpers.roomWithTwoClients();
        let spy = sinon.spy(room, "queueShuffleToggle");

        room.onRoomEvent(function (data, room) {
            var queueControlResponse = new event();
            let queue = room.transportConstructs.queue();
            let queueStatus = room.transportConstructs.queueStatus();
            queueControlResponse.addBroadcastEventFromConstruct(queueStatus);
            queueControlResponse.addBroadcastEventFromConstruct(queue);
            assert.deepStrictEqual(data, queueControlResponse);

            // Should have been called once
            assert.ok(spy.calledOnce);

            // restore the original function
            spy.restore();
            done();
        })

        room.incomingEvents.queueControl("toggleShuffle");
    })

    it('Should only call back with the queue', function (done) {
        let room = testHelpers.roomWithTwoClients();
        let spyQueueShuffle = sinon.spy(room, "queueShuffleToggle");
        let spyQueueEmpty = sinon.spy(room.queue, "empty");
        let spyQueuePrev = sinon.spy(room, "playPrevInQueue");
        let spyQueueNext = sinon.spy(room, "playNextInQueue");

        room.onRoomEvent(function (data, room) {
            var queueControlResponse = new event();
            let queue = room.transportConstructs.queue();
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
        })

        room.incomingEvents.queueControl("garbage");
    })

    it('Should call back with the new client list', function (done) {
        let room = testHelpers.roomWithTwoClients();

        room.onRoomEvent(function (data, room) {
            var removeClientResponse = new event();
            let clients = this.transportConstructs.clients();
            removeClientResponse.addBroadcastEventFromConstruct(clients);
            assert.deepStrictEqual(data, removeClientResponse);

            done();
        })
        // TODO Test: more thoroughly
        room.incomingEvents.disconnectClient(room.clients.fakeID1);
    })

    it('Should call back with all data including video', function (done) {
        let room = testHelpers.roomWithTwoClients(), newClientResponse = new event(), returnedClient;
        // let newClientExpected = new classes.Login("fakeID3", undefined, "fakeName3");
        let socketObjectMock = {
            id: "fakeID3"
        }
        let newClientExpected = new classes.Login(socketObjectMock.id, socketObjectMock, socketObjectMock.id)

        room.currentVideo.duration = 1;
        room.currentVideo.playVideo();

        room.onRoomEvent(function (data, room) {
            let queue = this.transportConstructs.queue();
            let queueStatus = this.transportConstructs.queueStatus();
            let video = this.transportConstructs.currentVideo();
            let clients = this.transportConstructs.clients();
            newClientResponse.addBroadcastEventFromConstruct(clients);
            newClientResponse.addSendEventFromConstruct(queue);
            newClientResponse.addSendEventFromConstruct(queueStatus);
            newClientResponse.addSendEventFromConstruct(video);
            newClientResponse.addSendEvent("initFinished", "1");
            

            assert.deepStrictEqual(data, newClientResponse);
        })

        room.onClientEvent(function (data, room, client) {
            assert.deepStrictEqual(data, newClientResponse);
            assert.strictEqual(client.id, newClientExpected.id);
            assert.strictEqual(client._name, newClientExpected._name);
            done();
        })

        returnedClient = room.incomingEvents.newClient(socketObjectMock);
    })

    it('Should return new client and call back with all data', function (done) {
        let room = testHelpers.roomWithTwoClients(), newClientResponse = new event(), returnedClient;
        // let newClientExpected = new classes.Login("fakeID3", undefined, "fakeName3");
        let socketObjectMock = {
            id: "fakeID3"
        }
        let newClientExpected = new classes.Login(socketObjectMock.id, socketObjectMock, socketObjectMock.id)

        room.onRoomEvent(function (data, room) {
            let queue = this.transportConstructs.queue();
            let queueStatus = this.transportConstructs.queueStatus();
            let clients = this.transportConstructs.clients();
            newClientResponse.addBroadcastEventFromConstruct(clients);
            newClientResponse.addSendEventFromConstruct(queue);
            newClientResponse.addSendEventFromConstruct(queueStatus);
            newClientResponse.addSendEvent("initFinished", "1");

            assert.deepStrictEqual(data, newClientResponse);
        })

        room.onClientEvent(function (data, room, client) {
            assert.deepStrictEqual(data, newClientResponse);
            assert.strictEqual(client.id, newClientExpected.id);
            assert.strictEqual(client._name, newClientExpected._name);
            done();
        })

        returnedClient = room.incomingEvents.newClient(socketObjectMock);
    })

    it('Should call back with clients after new status received', function (done) {
        let room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        let stateJSON = {
            "videoID": undefined,
            data: {
                "state": 3,
                "preloading": false,
                "firstVideo": false
            }
        };

        room.onRoomEvent(function (data, room) {
            let statusResponse = new event();
            let clients = this.transportConstructs.clients();
            statusResponse.addBroadcastEventFromConstruct(clients);

            assert.deepStrictEqual(data, statusResponse);
            done();
        })

        room.incomingEvents.receiverPlayerStatus(stateJSON, room.clients.fakeID1);
    })

    it('Should set the video to state 3', function () {
        let room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        let stateJSON = {
            "videoID": undefined,
            data: {
                "state": 3,
                "preloading": false,
                "firstVideo": false
            }
        };

        room.incomingEvents.receiverPlayerStatus(stateJSON, room.clients.fakeID1);
        assert.strictEqual(room.currentVideo.state, 3);
    })

    it('Should do nothing, invalid client video', function () {
        let room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        let stateJSON = {
            "videoID": "wrongID",
            data: {
                "state": 3,
                "preloading": false,
                "firstVideo": false
            }
        };

        let returnCode = room.incomingEvents.receiverPlayerStatus(stateJSON, room.clients.fakeID1);
        assert.notStrictEqual(room.currentVideo.state, 3);
        assert.strictEqual(returnCode, 1);
    })

    it('Should do nothing, client preloading', function () {
        let room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        let stateJSON = {
            "videoID": undefined,
            data: {
                "state": 3,
                "preloading": true,
                "firstVideo": false
            }
        };

        room.incomingEvents.receiverPlayerStatus(stateJSON, room.clients.fakeID1);
        assert.notStrictEqual(room.currentVideo.state, 3);
    })

    it('Should resume clients', function () {
        let room = testHelpers.roomWithTwoClients();
        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();
        let stateJSON = {
            "videoID": undefined,
            data: {
                "state": 3,
                "preloading": false,
                "firstVideo": false
            }
        };
        let notBufferingStateJSON = {
            "videoID": undefined,
            data: {
                "state": 1,
                "preloading": false,
                "firstVideo": false
            }
        };

        room.incomingEvents.receiverPlayerStatus(stateJSON, room.clients.fakeID1);
        assert.strictEqual(room.currentVideo.state, 3);
        room.incomingEvents.receiverPlayerStatus(notBufferingStateJSON, room.clients.fakeID1);
        assert.strictEqual(room.currentVideo.state, 1);
    })
});

describe('Room time sensitive events', function () {
    const testTimestamp = 5;

    beforeEach(function () {
        this.clock = sinon.useFakeTimers(testTimestamp);
    })

    afterEach(function () {
        this.clock.restore();
    })

    it('Should callback with timestamp for client', function (done) {
        let room = testHelpers.roomWithTwoClients();

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        room.clients.fakeID1.status.requiresTimestamp = true;

        let timestampForClient = new event();
        timestampForClient.addSendEvent("serverVideoTimestamp", room.currentVideo.getElapsedTime());

        room.onClientEvent(function (data, room, client) {
            assert.deepStrictEqual(client, room.clients.fakeID1);
            assert.deepStrictEqual(data, timestampForClient);
            done();
        })

        room.sendTimestampIfClientRequires(room.clients.fakeID1);
    });

    it('Should not callback with timestamp for client as video finished', function (done) {
        let room = testHelpers.roomWithTwoClients();

        room.currentVideo.duration = 1000;
        room.currentVideo.state = 0;

        room.clients.fakeID1.status.requiresTimestamp = true;

        let timestampForClient = new event();
        timestampForClient.addSendEvent("serverVideoTimestamp", room.currentVideo.getElapsedTime());

        room.onClientEvent(function () {
            done();  // Should not be called
        })

        room.sendTimestampIfClientRequires(room.clients.fakeID1);
        done();
    });

    it('Should not callback with timestamp for client as not required', function (done) {
        let room = testHelpers.roomWithTwoClients();

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        room.clients.fakeID1.status.requiresTimestamp = false;

        let timestampForClient = new event();
        timestampForClient.addSendEvent("serverVideoTimestamp", room.currentVideo.getElapsedTime());

        room.onClientEvent(function () {
            done();  // Should not be called
        });

        room.sendTimestampIfClientRequires(room.clients.fakeID1);
        done();
    });

    it('Should callback with current timestamp', function (done){
        let room = testHelpers.roomWithTwoClients();
        let ts = 100;
        let data = {
            videoID: undefined
        }

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        this.clock.tick(ts);

        room.incomingEvents.currentTimestampRequest(data, function(timestamp, error){
            assert.strictEqual(timestamp, ts);
            done();
        });
    })

    it('Should callback with error as invalid ID', function (done){
        let room = testHelpers.roomWithTwoClients();
        let ts = 100;
        let data = {
            videoID: "invalid"
        }

        room.currentVideo.duration = 1000;
        room.currentVideo.playVideo();

        this.clock.tick(ts);

        room.incomingEvents.currentTimestampRequest(data, function(timestamp, error){
            assert.ok(error);
            done();
        });
    })
    it('Should callback with the new timestamp', function (done){
        let room = testHelpers.roomWithTwoClients();
        let expected = {
            timestamp: 5000,
            videoID: undefined
        };

        room.onNotClientEvent(function (data, room) {
            assert.strictEqual(data.broadcastEvents.serverVideoTimestamp, expected.timestamp);
            done();
        })

        room.incomingEvents.newTimestamp(expected, new Login());
    });
});

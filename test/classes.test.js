const assert = require('assert');
const sinon = require('sinon');

const testHelpers = require('../src/test/setupFunctions');

// Classes
var classes = require('../web/js/classes');
const { queue } = require('jquery');
const { Video, ServerVideo } = require('../web/js/classes');

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

// Test video object timekeeping
describe('Video object timekeeping test', function () {
    this.timeout(15000);
    let video = new classes.ServerVideo();
    it('Time after 5 seconds', function (done) {
        let elapsedTime = 5000;
        video.startingTime = new Date().getTime();
        let timestamp = video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime());
        done(assert.ok((4.980 < timestamp && timestamp < 5.020), video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime())));
    });
    it('Time after 10 seconds', function (done) {
        let elapsedTime = 10000;
        video.startingTime = new Date().getTime();
        let timestamp = video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime());
        done(assert.ok((9.980 < timestamp && timestamp < 10.020), video.getElapsedTime(new Date(Date.now() + elapsedTime).getTime())));
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
        assert.throws(() => {queue.addVideosCombo(rmPlaylistJSON)});
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

    it('Should empty and reset the queue', function() {
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

        assert.strictEqual(queue._currentIndex, 0);
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
});

// Server video tests
describe('Server video tests', function () {
    it('State change should call back', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1;
        newServerVideo.onStateChange((newState) => {
            done(assert.strictEqual(newState, expected));
        })

        newServerVideo.state = expected;
    })


    it('Should set time * 1000', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 5000;

        newServerVideo.duration = (expected / 1000);

        assert.strictEqual(newServerVideo.duration, expected)
    })

    it('Should set state 1', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo.state, expected)
    })
    it('Should set state 2', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 2;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        assert.strictEqual(newServerVideo.state, expected)
    })
    it('Should set state 3', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 3;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

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

    it('Should not call back as paused', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        let elapsed = 100;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        this.clock.tick(elapsed);

        newServerVideo.pauseVideo();
        assert.strictEqual(newServerVideo._pausedSince, testTimestamp + elapsed);
    })

    it('Should pause the video timer', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            newServerVideo.playVideo();
            done(assert.strictEqual(Math.floor(newServerVideo.pausedTime), expected / 1000));
        }, expected);

        this.clock.tick(expected);
    })


    it('Should get paused time whilst playing', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            newServerVideo.playVideo();
            done(assert.strictEqual(Math.floor(newServerVideo.pausedTime), expected / 1000));
        }, expected);

        this.clock.tick(expected);
    })

    it('Should get paused time whilst still paused', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        newServerVideo.pauseVideo();
        setTimeout(() => {
            done(assert.strictEqual(Math.floor(newServerVideo.pausedTime), expected / 1000));
        }, expected);

        this.clock.tick(expected);
    })

    it('Play delay should call back', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 5;

        newServerVideo.onPlayDelay((newState) => {
            done(assert.strictEqual(newState, expected));
        })

        newServerVideo.state = expected;
        this.clock.tick(2000);
    })

    it('Should set the starting time correctly', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo.startingTime, testTimestamp);
    })

    it('Should resume the timer correctly', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

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

    it('Should set the time remaining correctly', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 2500;
        newServerVideo.duration = (expected / 1000);

        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo._timeRemainingSinceLastResumed, expected);
    })

    it('Should set the time remaining correctly', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1500;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();

        this.clock.tick(1000);
        newServerVideo.pauseVideo();
        newServerVideo.playVideo();

        assert.strictEqual(newServerVideo._timeRemainingSinceLastResumed, expected);
    })

    it('Should not call back as not finished', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.whenFinished(function () {
            assert.fail("Video should not yet have finished");
        })

        newServerVideo.playVideo();

        this.clock.tick(duration - 100);
    })

    it('Should call back as finished', function (done){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.whenFinished(function () {
            done();
        })

        newServerVideo.playVideo();

        this.clock.tick(duration);
    })

    it('Should not call back as paused', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.whenFinished(function () {
            assert.fail("Video should not yet have finished");
        })

        newServerVideo.playVideo();
        newServerVideo.pauseVideo();

        this.clock.tick(duration);
    })

    // TODO: Test callback when timestamp has been changed

    it('Should get elapsed time', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();
        this.clock.tick(expected);

        assert.strictEqual(newServerVideo.getElapsedTime(), expected / 1000);
    })
    it('Should get elapsed time whilst paused', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 1000;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        newServerVideo.playVideo();
        this.clock.tick(expected);
        newServerVideo.pauseVideo();
        this.clock.tick(expected);  // This should not affect the video's timestamp (it should be paused)

        assert.strictEqual(newServerVideo.getElapsedTime(), expected / 1000);
    })

    it('Should get elapsed time as 0', function (){
        let newServerVideo = new classes.ServerVideo("testID", "testTitle");
        let expected = 0;
        let duration = 2500;
        newServerVideo.duration = (duration / 1000);

        this.clock.tick(expected);

        assert.strictEqual(newServerVideo.getElapsedTime(), expected / 1000);
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
            "index": 0
        }
        
        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });

    it('Should return correct queue status JSON', function () {
        let room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        
        let queueStatusTransportConstruct = room.transportConstructs.queueStatus();
        let expected = {
            "shuffle": room.queue.shuffle
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



describe('Room event tests', function () {
    it('Should add a new client to the room', function () {
        let room = testHelpers.roomWithTwoClients();
        room.queue.addVideosFromCSV("https://youtu.be/xi3c-9qzrPY?list=RDMMEK_LN3XEcnw,https://youtu.be/ez1Kv8hiQGU?list=RDMMEK_LN3XEcnw");
        
        let queueTransportConstruct = room.transportConstructs.queue();
        let expected = {
            "videos": room.queue.videos,
            "length": 2,
            "index": 0
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
            "index": 0
        }
        
        assert.deepStrictEqual(queueTransportConstruct.data, expected);
    });
});
# remote-media
![Azure DevOps builds](https://img.shields.io/azure-devops/build/banksio/ca05dcdb-cddf-47ad-b524-a5943bb56d8d/6)

A node.js web app to synchronise YouTube videos (and the audio) between different users.

Currently in beta: There may still be some rough edges, but please feel free to test it and report any bugs found, or new features that may be beneficial!
## Features
* Play a YouTube video in sync across multiple clients.
* Enqueue other YouTube videos to play automatically after the current video.

Coming soon:
* Automatically parse YouTube playlists for their videos.
* Keep the videos in sync if someone seeks.
## Usage
### Prerequisites
* Node.js and npm
### Run
1. Clone or download the repo onto your local machine or server.
2. Run `npm install`.
3. Run `npm start`.
4. Connect to the web interface on port 3694.

The default page is the "reciever", and the admin panel is used to control the media playing on the recievers. The admin page is located at `/admin`.

**If it doesn't work, please [submit a bug](https://github.com/banksio/KeyboardDisplay/issues).**

## Development
To develop for remote-media, just follow the same usage instructions as above.

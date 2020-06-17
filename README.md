# remote-media
![Azure DevOps builds](https://img.shields.io/azure-devops/build/banksio/ca05dcdb-cddf-47ad-b524-a5943bb56d8d/6)
![Azure DevOps tests](https://img.shields.io/azure-devops/tests/banksio/remote-media/6)
![GitHub commit activity](https://img.shields.io/github/commit-activity/y/banksio/remote-media)
![Docker Pulls](https://img.shields.io/docker/pulls/banksio/remote-media)

A node.js web app to synchronise YouTube videos (and the audio) between different users.

Currently in beta: There may still be some rough edges, but please feel free to test it and report any bugs found, or new features that may be beneficial!
## Features
* Play a YouTube video in sync across multiple clients.
* Enqueue other YouTube videos to play automatically after the current video.
* Automatically parse YouTube playlists for their videos. (Only up to 100 videos for now due to a bug upstream)

Coming soon:

* Keep the videos in sync if someone seeks.
## Run
### Docker
remote-media can be run with docker using the docker hub, `docker-compose` file or just by building a docker image manually from the repo.

Through Docker Hub:
```bash
docker pull banksio/remote-media
docker run --publish 3694:3694 --detach --name remotemedia banksio/remote-media:latest
```

With docker-compose:

```bash
git clone https://github.com/banksio/remote-media.git
cd remote-media
docker-compose up
```

Building manually:

```bash
git clone https://github.com/banksio/remote-media.git
cd remote-media
docker build --tag remote-media:1.0 .
docker run --publish 3694:3694 --detach --name remotemedia remote-media:1.0
```

And kill with: `docker rm --force remotemedia`

### Manual
#### Prerequisites
* Node.js and npm


1. Clone or download the repo onto your local machine or server.
2. Run `npm install`.
3. Run `npm start`.
4. Connect to the web interface on port 3694.

## Usage
remote-media runs on port 3694 by default.

The root page is the "reciever", and the admin panel is used to control the media playing on the recievers. The admin page is located at `/admin`.

**If it doesn't work, please [submit a bug](https://github.com/banksio/remote-media/issues).**

## Development
To develop for remote-media, just follow the instructions listed to run the app manually above.

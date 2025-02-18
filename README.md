# Briefly

Below is verbatim copy of the README.md from Matt Webb's repo for this project.  The only addition I have done here is to have hacked in a subroutine that will monitor for an MQTT message. 
My objective was to be able to force an "on demand" sync rather than having to wait for the refresh cycle.

I have added two lines in the sample docker-compose for environment variables for MQTT_BROKER_URL and TOPIC.

My intention is put a button in my home assistant that sends an MQTT message to force a refresh - or perhaps put a button on a webpage.

I'm sure I have made a mess of things - but I was able to get my docker container to spin up and have tested sending an MQTT message.



---

[![Website](https://img.shields.io/badge/-Website-lightblue.svg?longCache=true&style=for-the-badge&logo=data:image/svg%2bxml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MjAiCmhlaWdodD0iNDIwIiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiPgo8cGF0aCBzdHJva2Utd2lkdGg9IjI2IgpkPSJNMjA5LDE1YTE5NSwxOTUgMCAxLDAgMiwweiIvPgo8cGF0aCBzdHJva2Utd2lkdGg9IjE4IgpkPSJtMjEwLDE1djM5MG0xOTUtMTk1SDE1TTU5LDkwYTI2MCwyNjAgMCAwLDAgMzAyLDAgbTAsMjQwIGEyNjAsMjYwIDAgMCwwLTMwMiwwTTE5NSwyMGEyNTAsMjUwIDAgMCwwIDAsMzgyIG0zMCwwIGEyNTAsMjUwIDAgMCwwIDAtMzgyIi8+Cjwvc3ZnPg==)](https://orbitalsync.com)
[![GitHub](https://img.shields.io/badge/-GitHub-lightgrey.svg?longCache=true&style=for-the-badge&logo=github)](https://github.com/mattwebbio/orbital-sync)
[![GitHub Stars](https://img.shields.io/github/stars/mattwebbio/orbital-sync?style=for-the-badge&logo=github&labelColor=lightgrey&color=lightgrey)](https://github.com/mattwebbio/orbital-sync)

[Installation](https://orbitalsync.com/#getting-started) | [Configuration](https://orbitalsync.com/CONFIG.html) | [Changelog](CHANGELOG.md)

<img src="https://user-images.githubusercontent.com/420820/187585158-331400c3-18f3-4673-857e-44efd73c6104.svg" width="200" alt="Logo" />

# Orbital Sync

[![Tests](https://img.shields.io/github/actions/workflow/status/mattwebbio/orbital-sync/ci.yml?branch=master&label=tests&style=for-the-badge)](https://github.com/mattwebbio/orbital-sync/actions/workflows/ci.yml?query=branch%3Amaster)
[![Coverage](https://img.shields.io/codecov/c/github/mattwebbio/orbital-sync/master?style=for-the-badge)](https://app.codecov.io/gh/mattwebbio/orbital-sync/)
[![Version](https://img.shields.io/github/v/tag/mattwebbio/orbital-sync?label=version&style=for-the-badge)](CHANGELOG.md)

Orbital Sync synchronizes multiple Pi-hole instances for high availability (HA) using the built-in "teleporter". In
other words, it performs a "backup" in the Pi-hole admin interface of your primary Pi-hole instance, and then "restores"
that backup to any number of "secondary" Pi-holes also via their admin interface. As a result, it supports the
synchronization of anything currently supported by Pi-hole's "teleporter". See
"[Configuration](https://orbitalsync.com/CONFIG.html)" for the defaults.

### Alternatives

I love [Gravity Sync](https://github.com/vmstan/gravity-sync) and have used it for some time, but I personally find it
to be difficult to set up in some contexts (Docker, Unraid, Synology, etc.). Orbital Sync's approach is designed to rely less on
the servers running Pi-hole by instead acting on their admin interface just like you would.

### Why would I want multiple Pi-holes?

Ever had the server running your Pi-hole go down? Or have you ever needed to perform maintenance on that server? This can
obviously be extremely disruptive to anyone using your network. By running multiple Pi-hole instances (replicas) and
giving your network clients secondary/tertiary/etc DNS servers, any outage involving one of your Pi-hole instances
doesn't bring down your whole network.

## Getting Started

Set up your secondary Pi-hole instance(s) just like you did your primary. Once that's done, choose one of the following:

### Docker

[![Docker Pulls](https://img.shields.io/docker/pulls/mattwebbio/orbital-sync?logo=docker&style=for-the-badge)](https://hub.docker.com/r/mattwebbio/orbital-sync)
[![Docker Image Size](https://img.shields.io/docker/image-size/mattwebbio/orbital-sync/latest?logo=docker&style=for-the-badge)](https://hub.docker.com/r/mattwebbio/orbital-sync)

The following is an example Docker Compose file for running this project. See the
[configuration](https://orbitalsync.com/CONFIG.html) section for more environment variables.

```yaml
version: '3'
services:
  orbital-sync:
    image: mattwebbio/orbital-sync:1
    environment:
      PRIMARY_HOST_BASE_URL: 'https://pihole1.example.com'
      PRIMARY_HOST_PASSWORD: 'your_password1'
      SECONDARY_HOSTS_1_BASE_URL: 'https://pihole2.example.com'
      SECONDARY_HOSTS_1_PASSWORD: 'your_password2'
      SECONDARY_HOSTS_2_BASE_URL: 'http://192.168.1.3'
      SECONDARY_HOSTS_2_PASSWORD: 'your_password3'
      SECONDARY_HOSTS_3_BASE_URL: 'http://server:8080'
      SECONDARY_HOSTS_3_PASSWORD: 'your_password4'
      SECONDARY_HOSTS_3_PATH: '/apps/pi-hole'
      MQTT_BROKER_URL: 'mqtt://optional.url.for.mqtt'
      MQTT_BROKER_TOPIC: 'orbitalsync/trigger'
      INTERVAL_MINUTES: 60
```

The Orbital Sync Docker image is published to both DockerHub and the GitHub Package Repository:<br />
[mattwebbio/orbital-sync](https://hub.docker.com/r/mattwebbio/orbital-sync)<br />
[ghcr.io/mattwebbio/orbital-sync](https://github.com/mattwebbio/orbital-sync/pkgs/container/orbital-sync)

<details>
  <summary>Distroless images</summary>

[Distroless images](https://github.com/GoogleContainerTools/distroless/blob/main/README.md) are also available with `*-distroless` tags; for example, v1 is available as `mattwebbio/orbital-sync:1-distroless`. These images are slightly larger but are _theoretically_ more secure than the default Alpine-based images, because they're supposed to contain only the Orbital Sync code and its direct dependencies. They do not include a shell, package manager, or other tools that are typically present in a Linux distribution.

</details>

### Node

[![NPM Downloads](https://img.shields.io/npm/dt/orbital-sync?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/orbital-sync)

As with Docker, running with Node requires you export any required environment variables before running Orbital Sync. See the
[configuration](https://orbitalsync.com/CONFIG.html) section for more information.

```shell
npm install -g orbital-sync
orbital-sync
```

## Requirements

The admin web interfaces of all Pi-holes must be accessible by the container/server running this service. In other words,
they have to be on the same network.

It is recommended you run this service with Docker.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mattwebbio/orbital-sync&type=Date)](https://star-history.com/#mattwebbio/orbital-sync&Date)

## Disclaimer

[![GitHub](https://img.shields.io/github/license/mattwebbio/orbital-sync?style=for-the-badge)](LICENSE)

This project is not associated with the [official Pi-hole project](https://github.com/pi-hole) and is a community
maintained piece of software. See the [license](LICENSE).

Pi-hole is a [registered trademark](https://pi-hole.net/trademark-rules-and-brand-guidelines/) of Pi-hole LLC.

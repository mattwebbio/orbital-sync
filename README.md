<img src="https://user-images.githubusercontent.com/420820/187585158-331400c3-18f3-4673-857e-44efd73c6104.svg" width="200" alt="Logo" />

# Orbital Sync

[![Tests](https://img.shields.io/github/workflow/status/mattwebbio/orbital-sync/CI/master?label=tests&style=for-the-badge)](https://github.com/mattwebbio/orbital-sync/actions/workflows/ci.yml?query=branch%3Amaster)
[![Coverage](https://img.shields.io/codecov/c/github/mattwebbio/orbital-sync/master?style=for-the-badge)](https://app.codecov.io/gh/mattwebbio/orbital-sync/)
[![Release](https://img.shields.io/github/workflow/status/mattwebbio/orbital-sync/Release?label=release&style=for-the-badge)](https://github.com/mattwebbio/orbital-sync/actions/workflows/release.yml)
[![Version](https://img.shields.io/github/v/tag/mattwebbio/orbital-sync?label=version&style=for-the-badge)](CHANGELOG.md)

Orbital Sync synchronizes multiple Pi-hole instances for high availability (HA) using the built-in "teleporter". In
other words, it performs a "backup" in the Pi-hole admin interface of your primary Pi-hole instance, and then "restores"
that backup to any number of "secondary" Pi-holes also via their admin interface. As a result, it supports the
synchronization of anything currently supported by Pi-hole's "teleporter". See
"[Configuration](#configuration)" for the defaults.

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
[configuration](#configuration) section for more environment variables.

```yaml
version: '3'
services:
  orbital-sync:
    image: mattwebbio/orbital-sync:1
    environment:
      PRIMARY_HOST_BASE_URL: 'https://pihole1.example.com'
      PRIMARY_HOST_PASSWORD: 'your_password1'
      SECONDARY_HOST_1_BASE_URL: 'https://pihole2.example.com'
      SECONDARY_HOST_1_PASSWORD: 'your_password2'
      SECONDARY_HOST_2_BASE_URL: 'http://192.168.1.3'
      SECONDARY_HOST_2_PASSWORD: 'your_password3'
      SECONDARY_HOST_3_BASE_URL: 'http://server:8080'
      SECONDARY_HOST_3_PASSWORD: 'your_password4'
      SECONDARY_HOST_3_PATH: '/apps/pi-hole'
      INTERVAL_MINUTES: 30
```

The Orbital Sync Docker image is published to both DockerHub and the GitHub Package Repository:<br />
[mattwebbio/orbital-sync](https://hub.docker.com/r/mattwebbio/orbital-sync)<br />
[ghcr.io/mattwebbio/orbital-sync](https://github.com/mattwebbio/orbital-sync/pkgs/container/orbital-sync)

### Node

[![NPM Downloads](https://img.shields.io/npm/dt/orbital-sync?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/orbital-sync)

As with Docker, running with Node requires you export any required environment variables before running Orbital Sync. See the
[configuration](#configuration) section for more information.

```shell
npm install -g orbital-sync
orbital-sync
```

## Requirements

The admin web interfaces of all Pi-holes must be accessible by the container/server running this service. In other words,
they have to be on the same network.

It is recommended you run this service with Docker.

## Configuration

### Sync Configuration

| Environment Variable          | Required | Default  | Examples                                                        | Description                                                                                                                                                                                                  |
| ----------------------------- | -------- | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PRIMARY_HOST_BASE_URL`       | Yes      | N/A      | `http://192.168.1.2` or `https://pihole.example.com`            | The base URL of your Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash.                                                                                             |
| `PRIMARY_HOST_PATH`           | No       | `/admin` | `/` or `/apps/pi-hole`                                          | The path to be appended to your base URL. The default Pi-hole path is `/admin`, which is added automatically.                                                                                                |
| `PRIMARY_HOST_PASSWORD`       | Yes      | N/A      | `mypassword`                                                    | The password used to log in to the admin interface.                                                                                                                                                          |
| `SECONDARY_HOST_(#)_BASE_URL` | Yes      | N/A      | `http://192.168.1.3` or `https://pihole2.example.com`           | The base URL of your secondary Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash. Replace `(#)` with a number, starting at `1`, to add multiple secondary Pi-holes. |
| `SECONDARY_HOST_(#)_PATH`     | No       | `/admin` | `/` or `/apps/pi-hole`                                          | The path to be appended to your secondary base URL. The default Pi-hole path is `/admin`, which is added automatically. Replace `(#)` with a number, starting at `1`, to add multiple secondary Pi-holes.    |
| `SECONDARY_HOST_(#)_PASSWORD` | Yes      | N/A      | `mypassword2`                                                   | The password used to log in to the admin interface.                                                                                                                                                          |
| `INTERVAL_MINUTES`            | No       | 30       | Any non-zero positive integer, for example `5`, `30`, or `1440` | How long to wait between synchronizations. Defaults to five minutes. Remember that the DNS server on your secondary servers restarts everytime a sync is performed.                                          |
| `UPDATE_GRAVITY`              | No       | `true`   | `true`/`false`                                                  | Triggers a gravity update after a backup has been uploaded to a secondary Pi-hole. This updates adlists and restarts gravity.                                                                                |
| `SYNC_WHITELIST`              | No       | `true`   | `true`/`false`                                                  | Copies the whitelist                                                                                                                                                                                         |
| `SYNC_REGEX_WHITELIST`        | No       | `true`   | `true`/`false`                                                  | Copies the regex whitelist                                                                                                                                                                                   |
| `SYNC_BLACKLIST`              | No       | `true`   | `true`/`false`                                                  | Copies the blacklist                                                                                                                                                                                         |
| `SYNC_REGEXLIST`              | No       | `true`   | `true`/`false`                                                  | Copies the regex blacklist                                                                                                                                                                                   |
| `SYNC_ADLIST`                 | No       | `true`   | `true`/`false`                                                  | Copies the adlist                                                                                                                                                                                            |
| `SYNC_CLIENT`                 | No       | `true`   | `true`/`false`                                                  | Copies clients                                                                                                                                                                                               |
| `SYNC_GROUP`                  | No       | `true`   | `true`/`false`                                                  | Copies groups                                                                                                                                                                                                |
| `SYNC_AUDITLOG`               | No       | `false`  | `true`/`false`                                                  | Copies the audit log                                                                                                                                                                                         |
| `SYNC_STATICDHCPLEASES`       | No       | `false`  | `true`/`false`                                                  | Copies static dhcp leases                                                                                                                                                                                    |
| `SYNC_LOCALDNSRECORDS`        | No       | `true`   | `true`/`false`                                                  | Copies local DNS records                                                                                                                                                                                     |
| `SYNC_LOCALCNAMERECORDS`      | No       | `true`   | `true`/`false`                                                  | Copies local CNAME records                                                                                                                                                                                   |
| `SYNC_FLUSHTABLES`            | No       | `true`   | `true`/`false`                                                  | Clears existing data on the secondary (copy target) Pi-hole                                                                                                                                                  |
| `RUN_ONCE`                    | No       | `false`  | `true`/`false`                                                  | By default, `orbital-sync` runs indefinitely until stopped. Setting `RUN_ONCE` to `true` forces it to exit immediately after the first sync.                                                                 |

Secondary hosts must be sequential (`SECONDARY_HOST_1_BASE_URL`, `SECONDARY_HOST_2_BASE_URL`,
`SECONDARY_HOST_3_BASE_URL`, and so on) and start at number `1`. Any gaps (for example, `3` to `5` skipping `4`) will
result in hosts after the gap being skipped in the sync process.

### Notifications

| Environment Variable  | Required | Default | Examples                 | Description                                                                                                                          |
| --------------------- | -------- | ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NOTIFY_ON_SUCCESS`   | No       | `false` | `true`/`false`           | Send a notification if a sync completes successfully.                                                                                |
| `NOTIFY_ON_FAILURE`   | No       | `true`  | `true`/`false`           | Send notifications if a sync fails for any reason.                                                                                   |
| `NOTIFY_VIA_SMTP`     | No       | `false` | `true`/`false`           | Send notifications via email.                                                                                                        |
| `HONEYBADGER_API_KEY` | No       | N/A     | `hbp_xxxxxxxxxxxxxxxxxx` | Get notifications to honeybadger.io when the process crashes for any reason by creating a new project and putting your API key here. |
| `VERBOSE`             | No       | `false` | `true`/`false`           | Increases the verbosity of log output. Useful for debugging.                                                                         |
| `TZ`                  | No       | N/A     | `America/Los_Angeles`    | The timezone for the timestamps displayed in log output.                                                                             |

#### SMTP

| Environment Variable | Required | Default | Examples                  | Description                                                                  |
| -------------------- | -------- | ------- | ------------------------- | ---------------------------------------------------------------------------- |
| `SMTP_HOST`          | Yes      | N/A     | `smtp.example.com`        | The SMTP server host.                                                        |
| `SMTP_PORT`          | No       | `587`   | `25`/`587`/`465`          | The SMTP server port.                                                        |
| `SMTP_TLS`           | No       | `false` | `true`/`false`            | Should usually be set to `true` if using port `465`. Otherwise, leave as is. |
| `SMTP_USER`          | No       | N/A     | `orbitalsync@example.com` | The SMTP account username.                                                   |
| `SMTP_PASSWORD`      | No       | N/A     | `yourpasswordhere`        | The SMTP account password.                                                   |
| `SMTP_FROM`          | No       | N/A     | `orbitalsync@example.com` | The email address to send notifications from.                                |
| `SMTP_TO`            | Yes      | N/A     | `you@example.com`         | The email address to send notifications to. Can be a comma-seperated list.   |

## Disclaimer

[![GitHub](https://img.shields.io/github/license/mattwebbio/orbital-sync?style=for-the-badge)](LICENSE)

This project is not associated with the [official Pi-hole project](https://github.com/pi-hole) and is a community
maintained piece of software. See the [license](LICENSE).

Pi-hole is a [registered trademark](https://pi-hole.net/trademark-rules-and-brand-guidelines/) of Pi-hole LLC.

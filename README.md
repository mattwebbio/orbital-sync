# Pi-hole Sync

This project synchronizes multiple Pi-hole instances for high availability (HA) using the built-in "teleporter". In
other words, it performs a "backup" in the Pi-hole admin interface of your primary Pi-hole instance, and then "restores"
that backup to any number of "secondary" Pi-holes also via their admin interface. As a result, it supports the
synchronization of anything currently supported by Pi-hole's "teleporter". See
[Environment Variables](#environment-variables) for the defaults.

I love [gravity-sync](https://github.com/vmstan/gravity-sync), but I personally found it to be difficult to set up in
some contexts. Gravity Sync's approach is much more efficient, because it checks if there are any changes on the
primary before importing them on the secondary and restarting any services. I'm under the impression that this project,
however, will restart your secondary Pi-hole's DNS server any time a sync is performed because it is "restoring" a
backup.

## Getting Started

### Docker

The following is an example Docker Compose file for running this project. See the
[environment variables](#environment-variables) section for more configuration options.

```yaml
version: 3
services:
  pihole-sync:
    image: mattwebbio/pihole-sync
    restart: unless-stopped
    environment:
      PRIMARY_HOST_BASE_URL: 'https://pihole1.example.com'
      PRIMARY_HOST_PASSWORD: 'your_password1'
      SECONDARY_HOST_1_BASE_URL: 'https://pihole2.example.com'
      SECONDARY_HOST_1_PASSWORD: 'your_password2'
      SECONDARY_HOST_2_BASE_URL: 'http://192.168.1.3'
      SECONDARY_HOST_2_PASSWORD: 'your_password3'
      INTERVAL_MINUTES: 30
```

### Node

```shell
npm install -g pihole-sync
pihole-sync
```

## Requirements

The admin web interfaces of all Pi-holes must be accessible by the container/server running this service. In other words,
they have to be on the same network.

It is recommended you run this service with Docker.

## Environment Variables

| Variable                      | Required | Default | Examples                                                        | Description                                                                                                                                                                                                  |
| ----------------------------- | -------- | ------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PRIMARY_HOST_BASE_URL`       | Yes      | N/A     | `http://192.168.1.2` or `https://pihole.example.com`            | The base URL of your Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash.                                                                                             |
| `PRIMARY_HOST_PASSWORD`       | Yes      | N/A     | `mypassword`                                                    | The password used to log in to the admin interface.                                                                                                                                                          |
| `SECONDARY_HOST_(#)_BASE_URL` | Yes      | N/A     | `http://192.168.1.3` or `https://pihole2.example.com`           | The base URL of your secondary Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash. Replace `(#)` with a number, starting at `1`, to add multiple secondary Pi-holes. |
| `SECONDARY_HOST_(#)_PASSWORD` | Yes      | N/A     | `mypassword2`                                                   | The password used to log in to the admin interface.                                                                                                                                                          |
| `SYNC_WHITELIST`              | No       | `true`  | `true`/`false`                                                  | Copies the whitelist                                                                                                                                                                                         |
| `SYNC_REGEX_WHITELIST`        | No       | `true`  | `true`/`false`                                                  | Copies the regex whitelist                                                                                                                                                                                   |
| `SYNC_BLACKLIST`              | No       | `true`  | `true`/`false`                                                  | Copies the blacklist                                                                                                                                                                                         |
| `SYNC_REGEXLIST`              | No       | `true`  | `true`/`false`                                                  | Copies the regex blacklist                                                                                                                                                                                   |
| `SYNC_ADLIST`                 | No       | `true`  | `true`/`false`                                                  | Copies the adlist                                                                                                                                                                                            |
| `SYNC_CLIENT`                 | No       | `true`  | `true`/`false`                                                  | Copies clients                                                                                                                                                                                               |
| `SYNC_GROUP`                  | No       | `true`  | `true`/`false`                                                  | Copies groups                                                                                                                                                                                                |
| `SYNC_AUDITLOG`               | No       | `false` | `true`/`false`                                                  | Copies the audit log                                                                                                                                                                                         |
| `SYNC_STATICDHCPLEASES`       | No       | `false` | `true`/`false`                                                  | Copies static dhcp leases                                                                                                                                                                                    |
| `SYNC_LOCALDNSRECORDS`        | No       | `true`  | `true`/`false`                                                  | Copies local DNS records                                                                                                                                                                                     |
| `SYNC_LOCALCNAMERECORDS`      | No       | `true`  | `true`/`false`                                                  | Copies local CNAME records                                                                                                                                                                                   |
| `SYNC_FLUSHTABLES`            | No       | `true`  | `true`/`false`                                                  | Clears existing data on the secondary (copy target) Pi-hole                                                                                                                                                  |
| `VERBOSE`                     | No       | `false` | `true`/`false`                                                  | Whether to output extra log output. Used for debugging.                                                                                                                                                      |
| `RUN_ONCE`                    | No       | `false` | `true`/`false`                                                  | By default, `pihole-sync` runs indefinitely until stopped. Setting `RUN_ONCE` to `true` forces it to exit immediately after the first sync.                                                                  |
| `INTERVAL_MINUTES`            | No       | 30      | Any non-zero positive integer, for example `5`, `30`, or `1440` | How long to wait between synchronizations. Defaults to five minutes. Remember that the DNS server on your secondary servers restarts everytime a sync is performed.                                          |
| `HONEYBADGER_API_KEY`         | No       | N/A     | `hbp_xxxxxxxxxxxxxxxxxx`                                        | Get notifications to honeybadger.io when the process crashes for any reason by creating a new project and putting your API key here.                                                                         |

Secondary hosts must be sequential (`SECONDARY_HOST_1_BASE_URL`, `SECONDARY_HOST_2_BASE_URL`,
`SECONDARY_HOST_3_BASE_URL`, and so on) and start at number `1`. Any gaps (for example, `3` to `5` skipping `4`) will
result in hosts after the gap being skipped in the sync process.

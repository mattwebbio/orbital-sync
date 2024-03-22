[![Website](https://img.shields.io/badge/-Website-lightblue.svg?longCache=true&style=for-the-badge&logo=data:image/svg%2bxml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MjAiCmhlaWdodD0iNDIwIiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiPgo8cGF0aCBzdHJva2Utd2lkdGg9IjI2IgpkPSJNMjA5LDE1YTE5NSwxOTUgMCAxLDAgMiwweiIvPgo8cGF0aCBzdHJva2Utd2lkdGg9IjE4IgpkPSJtMjEwLDE1djM5MG0xOTUtMTk1SDE1TTU5LDkwYTI2MCwyNjAgMCAwLDAgMzAyLDAgbTAsMjQwIGEyNjAsMjYwIDAgMCwwLTMwMiwwTTE5NSwyMGEyNTAsMjUwIDAgMCwwIDAsMzgyIG0zMCwwIGEyNTAsMjUwIDAgMCwwIDAtMzgyIi8+Cjwvc3ZnPg==)](https://orbitalsync.com)
[![GitHub](https://img.shields.io/badge/-GitHub-lightgrey.svg?longCache=true&style=for-the-badge&logo=github)](https://github.com/mattwebbio/orbital-sync)
[![GitHub Stars](https://img.shields.io/github/stars/mattwebbio/orbital-sync?style=for-the-badge&logo=github&labelColor=lightgrey&color=lightgrey)](https://github.com/mattwebbio/orbital-sync)

[Installation](https://orbitalsync.com/#getting-started) | [Configuration](https://orbitalsync.com/CONFIGURATION.html) | [Changelog](CHANGELOG.md)

<img src="https://user-images.githubusercontent.com/420820/187585158-331400c3-18f3-4673-857e-44efd73c6104.svg" width="200" alt="Logo" />

# Orbital Sync: Configuration

<!-- START CONFIG DOCS -->

| Environment Variable | Required | Default | Example                                                         | Description                                                                                                                                                          |
| -------------------- | -------- | ------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UPDATE_GRAVITY`     | No       | `true`  | `true`/`false`                                                  | Triggers a gravity update after a backup has been uploaded to a secondary Pi-hole. This updates adlists and restarts gravity.                                        |
| `VERBOSE`            | No       | `false` | `true`/`false`                                                  | Increases the verbosity of log output. Useful for debugging.                                                                                                         |
| `RUN_ONCE`           | No       | `false` | `true`/`false`                                                  | By default, Orbital Sync runs indefinitely until stopped. Setting this to `true` forces it to exit immediately after the first sync.                                 |
| `INTERVAL_MINUTES`   | No       | `60`    | Any non-zero positive integer, for example `5`, `30`, or `1440` | How long to wait between synchronizations. Defaults to five minutes. Remember that the DNS server on your secondary servers restarts every time a sync is performed. |

## Primary Host

| Environment Variable    | Required | Default | Example                                              | Description                                                                                                      |
| ----------------------- | -------- | ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `PRIMARY_HOST_BASE_URL` | Yes      | N/A     | `http://192.168.1.2` or `https://pihole.example.com` | The base URL of your Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash. |
| `PRIMARY_HOST_PASSWORD` | Yes      | N/A     | `mypassword`                                         | The password used to log in to the admin interface.                                                              |
| `PRIMARY_HOST_PATH`     | No       | N/A     | `/` or `/apps/pi-hole`                               | The path to be appended to your base URL. The default Pi-hole path is `/admin`, which is added automatically.    |

## Secondary Hosts

Replace (#) with a number, starting at 1, to add multiple. Each must be sequential, (i.e. `SECONDARY_HOSTS_BASE_URL_1`, `SECONDARY_HOSTS_BASE_URL_2`, `SECONDARY_HOSTS_BASE_URL_3`, and so on) and start at number 1. Any gaps (for example, 3 to 5 skipping 4) will result in configuration after the gap being skipped.

| Environment Variable           | Required | Default | Example                                               | Description                                                                                                                |
| ------------------------------ | -------- | ------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `SECONDARY_HOSTS_BASE_URL_(#)` | Yes      | N/A     | `http://192.168.1.3` or `https://pihole2.example.com` | The base URL of your secondary Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash. |
| `SECONDARY_HOSTS_PASSWORD_(#)` | Yes      | N/A     | `mypassword2`                                         | The password used to log in to the admin interface.                                                                        |
| `SECONDARY_HOSTS_PATH_(#)`     | No       | N/A     | `/` or `/apps/pi-hole`                                | The path to be appended to your secondary base URL. The default Pi-hole path is `/admin`, which is added automatically.    |

## Sync

### V5

| Environment Variable          | Required | Default | Example        | Description                                                 |
| ----------------------------- | -------- | ------- | -------------- | ----------------------------------------------------------- |
| `SYNC_V5_WHITELIST`           | No       | `true`  | `true`/`false` | Copies the whitelist                                        |
| `SYNC_V5_REGEX_WHITELIST`     | No       | `true`  | `true`/`false` | Copies the regex whitelist                                  |
| `SYNC_V5_BLACKLIST`           | No       | `true`  | `true`/`false` | Copies the blacklist                                        |
| `SYNC_V5_REGEX_LIST`          | No       | `true`  | `true`/`false` | Copies the regex blacklist                                  |
| `SYNC_V5_AD_LIST`             | No       | `true`  | `true`/`false` | Copies adlists                                              |
| `SYNC_V5_CLIENT`              | No       | `true`  | `true`/`false` | Copies clients                                              |
| `SYNC_V5_GROUP`               | No       | `true`  | `true`/`false` | Copies groups                                               |
| `SYNC_V5_AUDIT_LOG`           | No       | `false` | `true`/`false` | Copies the audit log                                        |
| `SYNC_V5_STATIC_DHCP_LEASES`  | No       | `false` | `true`/`false` | Copies static DHCP leases                                   |
| `SYNC_V5_LOCAL_DNS_RECORDS`   | No       | `true`  | `true`/`false` | Copies local DNS records                                    |
| `SYNC_V5_LOCAL_CNAME_RECORDS` | No       | `true`  | `true`/`false` | Copies local CNAME records                                  |
| `SYNC_V5_FLUSH_TABLES`        | No       | `true`  | `true`/`false` | Clears existing data on the secondary (copy target) Pi-hole |

## Notify

| Environment Variable | Required | Default | Example        | Description                                           |
| -------------------- | -------- | ------- | -------------- | ----------------------------------------------------- |
| `NOTIFY_ON_SUCCESS`  | No       | `false` | `true`/`false` | Send a notification if a sync completes successfully. |
| `NOTIFY_ON_FAILURE`  | No       | `true`  | `true`/`false` | Send a notification if a sync fails for any reason.   |

### Smtp

| Environment Variable   | Required | Default | Example                   | Description                                                                |
| ---------------------- | -------- | ------- | ------------------------- | -------------------------------------------------------------------------- |
| `NOTIFY_SMTP_ENABLED`  | No       | `false` | `true`/`false`            | Send notifications via email.                                              |
| `NOTIFY_SMTP_FROM`     | No       | N/A     | `orbitalsync@example.com` | The email address to send notifications from.                              |
| `NOTIFY_SMTP_TO`       | No       | N/A     | `you@example.com`         | The email address to send notifications to. Can be a comma-separated list. |
| `NOTIFY_SMTP_HOST`     | No       | N/A     | `smtp.example.com`        | The SMTP server host.                                                      |
| `NOTIFY_SMTP_PORT`     | No       | N/A     | `25`/`587`/`465`          | The SMTP server port.                                                      |
| `NOTIFY_SMTP_TLS`      | No       | `false` | `true`/`false`            | Should usually be set to true if using port 465. Otherwise, leave as is.   |
| `NOTIFY_SMTP_USER`     | No       | N/A     | `orbitalsync@example.com` | The SMTP account username.                                                 |
| `NOTIFY_SMTP_PASSWORD` | No       | N/A     | `yourpasswordhere`        | The SMTP account password.                                                 |

### Exceptions

| Environment Variable                    | Required | Default | Example                             | Description                                                                                        |
| --------------------------------------- | -------- | ------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NOTIFY_EXCEPTIONS_HONEYBADGER_API_KEY` | No       | N/A     | `hbp_xxxxxxxxxxxxxxxxxx`            | Set to use Honeybadger for proper exception recording; mostly useful for development or debugging. |
| `NOTIFY_EXCEPTIONS_SENTRY_DSN`          | No       | N/A     | `https://key@o0.ingest.sentry.io/0` | Set to use Sentry for proper exception recording; mostly useful for development or debugging.      |

<!-- END CONFIG DOCS -->

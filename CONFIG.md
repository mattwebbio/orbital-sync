[![Website](https://img.shields.io/badge/-Website-lightblue.svg?longCache=true&style=for-the-badge&logo=data:image/svg%2bxml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MjAiCmhlaWdodD0iNDIwIiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiPgo8cGF0aCBzdHJva2Utd2lkdGg9IjI2IgpkPSJNMjA5LDE1YTE5NSwxOTUgMCAxLDAgMiwweiIvPgo8cGF0aCBzdHJva2Utd2lkdGg9IjE4IgpkPSJtMjEwLDE1djM5MG0xOTUtMTk1SDE1TTU5LDkwYTI2MCwyNjAgMCAwLDAgMzAyLDAgbTAsMjQwIGEyNjAsMjYwIDAgMCwwLTMwMiwwTTE5NSwyMGEyNTAsMjUwIDAgMCwwIDAsMzgyIG0zMCwwIGEyNTAsMjUwIDAgMCwwIDAtMzgyIi8+Cjwvc3ZnPg==)](https://orbitalsync.com)
[![GitHub](https://img.shields.io/badge/-GitHub-lightgrey.svg?longCache=true&style=for-the-badge&logo=github)](https://github.com/mattwebbio/orbital-sync)
[![GitHub Stars](https://img.shields.io/github/stars/mattwebbio/orbital-sync?style=for-the-badge&logo=github&labelColor=lightgrey&color=lightgrey)](https://github.com/mattwebbio/orbital-sync)

[Installation](https://orbitalsync.com/#getting-started) | [Configuration](https://orbitalsync.com/CONFIGURATION.html) | [Changelog](CHANGELOG.md)

<img src="https://user-images.githubusercontent.com/420820/187585158-331400c3-18f3-4673-857e-44efd73c6104.svg" width="200" alt="Logo" />

# Orbital Sync

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

| Environment Variable  | Required | Default | Examples                            | Description                                                                                        |
| --------------------- | -------- | ------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NOTIFY_ON_SUCCESS`   | No       | `false` | `true`/`false`                      | Send a notification if a sync completes successfully.                                              |
| `NOTIFY_ON_FAILURE`   | No       | `true`  | `true`/`false`                      | Send notifications if a sync fails for any reason.                                                 |
| `NOTIFY_VIA_SMTP`     | No       | `false` | `true`/`false`                      | Send notifications via email.                                                                      |
| `HONEYBADGER_API_KEY` | No       | N/A     | `hbp_xxxxxxxxxxxxxxxxxx`            | Set to use Honeybadger for proper exception recording; mostly useful for development or debugging. |
| `SENTRY_DSN`          | No       | N/A     | `https://key@o0.ingest.sentry.io/0` | Set to use Sentry for proper exception recording; mostly useful for development or debugging.      |
| `VERBOSE`             | No       | `false` | `true`/`false`                      | Increases the verbosity of log output. Useful for debugging.                                       |
| `TZ`                  | No       | N/A     | `America/Los_Angeles`               | The timezone for the timestamps displayed in log output.                                           |

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

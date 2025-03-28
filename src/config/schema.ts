import { asConst } from 'json-schema-to-ts';

export const Schema = asConst({
  type: 'object',
  properties: {
    piHoleVersion: {
      $id: '/schemas/piHoleVersion',
      type: 'string',
      default: 'auto',
      enum: ['auto', '6', '5'],
      envVar: 'PIHOLE_VERSION',
      example: '`auto`, `6`, or `5`',
      description: 'The version of PiHole you are using'
    },
    primaryHost: {
      type: 'object',
      description: 'The primary Pi-hole that data will be copied from.',
      properties: {
        baseUrl: {
          type: 'string',
          envVar: 'PRIMARY_HOST_BASE_URL',
          example: '`http://192.168.1.2` or `https://pihole.example.com`',
          description:
            'The base URL of your Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash.'
        },
        password: {
          type: 'string',
          envVar: 'PRIMARY_HOST_PASSWORD',
          example: '`mypassword`',
          description: 'The password (v5) or app password (v6) used to login to PiHole.'
        },
        path: {
          type: 'string',
          envVar: 'PRIMARY_HOST_PATH',
          example: '`/` or `/apps/pi-hole`',
          description:
            'The path to be appended to your base URL. The default Pi-hole path is `/admin` (v5) or `/api` (v6), which is added automatically.'
        }
      },
      required: ['baseUrl', 'password']
    },
    secondaryHosts: {
      type: 'array',
      items: {
        type: 'object',
        description: 'Secondary Pi-holes that data will be copied to.',
        properties: {
          baseUrl: {
            type: 'string',
            envVar: 'SECONDARY_HOST_{{i}}_BASE_URL',
            example: '`http://192.168.1.3` or `https://pihole2.example.com`',
            description:
              'The base URL of your secondary Pi-hole, including the scheme (HTTP or HTTPS) and port but not including a following slash.'
          },
          password: {
            type: 'string',
            envVar: 'SECONDARY_HOST_{{i}}_PASSWORD',
            example: '`mypassword2`',
            description: 'The password used to log in to the admin interface.'
          },
          path: {
            type: 'string',
            envVar: 'SECONDARY_HOST_{{i}}_PATH',
            example: '`/` or `/apps/pi-hole`',
            description:
              'The path to be appended to your secondary base URL. The default Pi-hole path is `/admin`, which is added automatically.'
          }
        },
        required: ['baseUrl', 'password']
      },
      minItems: 1
    },
    sync: {
      type: 'object',
      description:
        'What data to copy from the primary Pi-hole to the secondary Pi-holes.',
      properties: {
        v5: {
          type: 'object',
          description: 'Sync options for Pi-hole v5.x.',
          properties: {
            whitelist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_WHITELIST',
              example: '`true`/`false`',
              description: 'Copies the whitelist'
            },
            regexWhitelist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_REGEX_WHITELIST',
              example: '`true`/`false`',
              description: 'Copies the regex whitelist'
            },
            blacklist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_BLACKLIST',
              example: '`true`/`false`',
              description: 'Copies the blacklist'
            },
            regexList: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_REGEXLIST',
              example: '`true`/`false`',
              description: 'Copies the regex blacklist'
            },
            adList: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_ADLIST',
              example: '`true`/`false`',
              description: 'Copies adlists'
            },
            client: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_CLIENT',
              example: '`true`/`false`',
              description: 'Copies clients'
            },
            group: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_GROUP',
              example: '`true`/`false`',
              description: 'Copies groups'
            },
            auditLog: {
              type: 'boolean',
              default: false,
              envVar: 'SYNC_AUDITLOG',
              example: '`true`/`false`',
              description: 'Copies the audit log'
            },
            staticDhcpLeases: {
              type: 'boolean',
              default: false,
              envVar: 'SYNC_STATICDHCPLEASES',
              example: '`true`/`false`',
              description: 'Copies static DHCP leases'
            },
            localDnsRecords: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_LOCALDNSRECORDS',
              example: '`true`/`false`',
              description: 'Copies local DNS records'
            },
            localCnameRecords: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_LOCALCNAMERECORDS',
              example: '`true`/`false`',
              description: 'Copies local CNAME records'
            },
            flushTables: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_FLUSHTABLES',
              example: '`true`/`false`',
              description: 'Clears existing data on the secondary (copy target) Pi-hole'
            }
          },
          required: [
            'whitelist',
            'regexWhitelist',
            'blacklist',
            'regexList',
            'adList',
            'client',
            'group',
            'auditLog',
            'staticDhcpLeases',
            'localDnsRecords',
            'localCnameRecords',
            'flushTables'
          ]
        },
        v6: {
          type: 'object',
          description: 'Sync options for Pi-hole v6.x.',
          properties: {
            config: {
              type: 'boolean',
              default: false,
              example: '`true`/`false`',
              description: 'Copies the TOML config file'
            },
            dhcp_leases: {
              type: 'boolean',
              default: true,
              envVar: 'DHCP_LEASES',
              example: '`true`/`false`',
              description: 'Copies the DHCP leases'
            },
            group: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_GROUP',
              example: '`true`/`false`',
              description: 'Copies groups'
            },
            adlist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_ADLIST',
              example: '`true`/`false`',
              description: 'Copies adlists'
            },
            adlist_by_group: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_ADLIST_BY_GROUP',
              example: '`true`/`false`',
              description: 'Copies adlists by group'
            },
            domainlist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_DOMAINLIST',
              example: '`true`/`false`',
              description: 'Copies domain list'
            },
            domainlist_by_group: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_DOMAINLIST_BY_GROUP',
              example: '`true`/`false`',
              description: 'Copies domain list by group'
            },
            client: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_CLIENT',
              example: '`true`/`false`',
              description: 'Copies clients'
            },
            client_by_group: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_CLIENT_BY_GROUP',
              example: '`true`/`false`',
              description: 'Copies clients by group'
            },
            gravityUpdateRetryCount: {
              type: 'number',
              default: 5,
              example: '`3`',
              description:
                'The number of times to retry updating gravity if it fails. Only used if `UPDATE_GRAVITY` is not set to `false`. Defaults to 5. Uses an exponential backoff; the second attempt will wait a second, the third attempt 2, the fourth attempt 4, the fifth attempt 8, and so on - up to a maximum of 60 seconds.'
            }
          },
          required: [
            'dhcp_leases',
            'group',
            'adlist',
            'adlist_by_group',
            'domainlist',
            'domainlist_by_group',
            'client',
            'client_by_group'
          ]
        }
      },
      required: ['v5', 'v6']
    },
    notify: {
      type: 'object',
      description: 'When to send notifications and how to send them.',
      properties: {
        onSuccess: {
          type: 'boolean',
          default: false,
          envVar: 'NOTIFY_ON_SUCCESS',
          example: '`true`/`false`',
          description: 'Send a notification if a sync completes successfully.'
        },
        onFailure: {
          type: 'boolean',
          default: true,
          envVar: 'NOTIFY_ON_FAILURE',
          example: '`true`/`false`',
          description: 'Send a notification if a sync fails for any reason.'
        },
        smtp: {
          type: 'object',
          description: 'Send notifications via email using SMTP',
          properties: {
            enabled: {
              type: 'boolean',
              default: false,
              envVar: 'SMTP_ENABLED',
              example: '`true`/`false`',
              description: 'Send notifications via email.'
            },
            from: {
              type: 'string',
              envVar: 'SMTP_FROM',
              example: '`orbitalsync@example.com`',
              description: 'The email address to send notifications from.'
            },
            to: {
              type: 'string',
              envVar: 'SMTP_TO',
              example: '`you@example.com`',
              description:
                'The email address to send notifications to. Can be a comma-separated list.'
            },
            host: {
              type: 'string',
              envVar: 'SMTP_HOST',
              example: '`smtp.example.com`',
              description: 'The SMTP server host.'
            },
            port: {
              type: 'number',
              envVar: 'SMTP_PORT',
              example: '`25`/`587`/`465`',
              description: 'The SMTP server port.'
            },
            tls: {
              type: 'boolean',
              default: false,
              envVar: 'SMTP_TLS',
              example: '`true`/`false`',
              description:
                'Should usually be set to true if using port 465. Otherwise, leave as is.'
            },
            user: {
              type: 'string',
              envVar: 'SMTP_USER',
              example: '`orbitalsync@example.com`',
              description: 'The SMTP account username.'
            },
            password: {
              type: 'string',
              envVar: 'SMTP_PASSWORD',
              example: '`yourpasswordhere`',
              description: 'The SMTP account password.'
            }
          }
        },
        exceptions: {
          type: 'object',
          description:
            'Log exceptions to [Honeybadger](https://www.honeybadger.io) or [Sentry](http://sentry.io/). Used mostly for development or debugging.',
          properties: {
            honeybadgerApiKey: {
              type: 'string',
              envVar: 'HONEYBADGER_API_KEY',
              example: '`hbp_xxxxxxxxxxxxxxxxxx`',
              description:
                'Set to use Honeybadger for proper exception recording; mostly useful for development or debugging.'
            },
            sentryDsn: {
              type: 'string',
              envVar: 'SENTRY_DSN',
              example: '`https://key@o0.ingest.sentry.io/0`',
              description:
                'Set to use Sentry for proper exception recording; mostly useful for development or debugging.'
            }
          }
        }
      }
    },
    updateGravity: {
      type: 'boolean',
      default: true,
      envVar: 'UPDATE_GRAVITY',
      example: '`true`/`false`',
      description:
        'Triggers a gravity update after a backup has been uploaded to a secondary Pi-hole. This updates adlists and restarts gravity.'
    },
    verbose: {
      type: 'boolean',
      default: false,
      envVar: 'VERBOSE',
      example: '`true`/`false`',
      description: 'Increases the verbosity of log output. Useful for debugging.'
    },
    runOnce: {
      type: 'boolean',
      default: false,
      envVar: 'RUN_ONCE',
      example: '`true`/`false`',
      description:
        'By default, Orbital Sync runs indefinitely until stopped. Setting this to `true` forces it to exit immediately after the first sync.'
    },
    intervalMinutes: {
      type: 'number',
      default: 60,
      envVar: 'INTERVAL_MINUTES',
      example: 'Any non-zero positive integer, for example `5`, `30`, or `1440`',
      description:
        'How long to wait between synchronizations. Defaults to sixty minutes. Remember that the DNS server on your secondary servers restarts every time a sync is performed.'
    }
  },
  required: [
    'primaryHost',
    'secondaryHosts',
    'sync',
    'notify',
    'updateGravity',
    'verbose',
    'runOnce',
    'intervalMinutes'
  ]
});

import { asConst } from 'json-schema-to-ts';

export const Schema = asConst({
  type: 'object',
  properties: {
    primaryHost: {
      type: 'object',
      properties: {
        baseUrl: {
          type: 'string',
          envVar: 'PRIMARY_HOST_BASE_URL'
        },
        password: {
          type: 'string',
          envVar: 'PRIMARY_HOST_PASSWORD'
        },
        path: {
          type: 'string',
          envVar: 'PRIMARY_HOST_PATH'
        }
      },
      required: ['baseUrl', 'password']
    },
    secondaryHosts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          baseUrl: {
            type: 'string',
            envVar: 'SECONDARY_HOST_{{i}}_BASE_URL'
          },
          password: {
            type: 'string',
            envVar: 'SECONDARY_HOST_{{i}}_PASSWORD'
          },
          path: {
            type: 'string',
            envVar: 'SECONDARY_HOST_{{i}}_PATH'
          }
        },
        required: ['baseUrl', 'password']
      },
      minItems: 1
    },
    sync: {
      type: 'object',
      properties: {
        v5: {
          type: 'object',
          properties: {
            whitelist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_WHITELIST'
            },
            regexWhitelist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_REGEX_WHITELIST'
            },
            blacklist: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_BLACKLIST'
            },
            regexList: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_REGEXLIST'
            },
            adList: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_ADLIST'
            },
            client: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_CLIENT'
            },
            group: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_GROUP'
            },
            auditLog: {
              type: 'boolean',
              default: false,
              envVar: 'SYNC_AUDITLOG'
            },
            staticDhcpLeases: {
              type: 'boolean',
              default: false,
              envVar: 'SYNC_STATICDHCPLEASES'
            },
            localDnsRecords: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_LOCALDNSRECORDS'
            },
            localCnameRecords: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_LOCALCNAMERECORDS'
            },
            flushTables: {
              type: 'boolean',
              default: true,
              envVar: 'SYNC_FLUSHTABLES'
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
        }
      },
      required: ['v5']
    },
    notify: {
      type: 'object',
      properties: {
        onSuccess: {
          type: 'boolean',
          default: false,
          envVar: 'NOTIFY_ON_SUCCESS'
        },
        onFailure: {
          type: 'boolean',
          default: true,
          envVar: 'NOTIFY_ON_FAILURE'
        },
        smtp: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              default: false,
              envVar: 'SMTP_ENABLED'
            },
            from: {
              type: 'string',
              envVar: 'SMTP_FROM'
            },
            to: {
              type: 'string',
              envVar: 'SMTP_TO'
            },
            host: {
              type: 'string',
              envVar: 'SMTP_HOST'
            },
            port: {
              type: 'number',
              envVar: 'SMTP_PORT'
            },
            tls: {
              type: 'boolean',
              default: false,
              envVar: 'SMTP_TLS'
            },
            user: {
              type: 'string',
              envVar: 'SMTP_USER'
            },
            password: {
              type: 'string',
              envVar: 'SMTP_PASSWORD'
            }
          }
        },
        exceptions: {
          type: 'object',
          properties: {
            honeybadgerApiKey: {
              type: 'string',
              envVar: 'HONEYBADGER_API_KEY'
            },
            sentryDsn: {
              type: 'string',
              envVar: 'SENTRY_DSN'
            }
          }
        }
      }
    },
    updateGravity: {
      type: 'boolean',
      default: true,
      envVar: 'UPDATE_GRAVITY'
    },
    verbose: {
      type: 'boolean',
      default: false,
      envVar: 'VERBOSE'
    },
    runOnce: {
      type: 'boolean',
      default: false,
      envVar: 'RUN_ONCE'
    },
    intervalMinutes: {
      type: 'number',
      default: 60,
      envVar: 'INTERVAL_MINUTES'
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

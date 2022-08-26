class MissingEnvironmentVariableError extends Error {}

function getRequiredEnv(variable: string): string {
  const value = process.env[variable];

  if (value === undefined)
    throw new MissingEnvironmentVariableError(`The environment variable ${variable} is required but not defined.`);

  return value;
}

function getSecondaryHosts(): Host[] {
  const hosts: Host[] = [{
    baseUrl: getRequiredEnv('SECONDARY_HOST_1_BASE_URL'),
    password: getRequiredEnv('SECONDARY_HOST_1_PASSWORD')
  }];

  let count = 2;
  while (
    process.env[`SECONDARY_HOST_${count}_BASE_URL`] !== undefined &&
    process.env[`SECONDARY_HOST_${count}_PASSWORD`] !== undefined
  ) {
    hosts.push({
      baseUrl: process.env[`SECONDARY_HOST_${count}_BASE_URL`]!,
      password: process.env[`SECONDARY_HOST_${count}_PASSWORD`]!
    });

    count++;
  }

  return hosts;
}

export const Config: {
  primary: Host;
  secondaries: Host[];
  sync: {
    whitelist: boolean;
    regex_whitelist: boolean;
    blacklist: boolean;
    regexlist: boolean;
    adlist: boolean;
    client: boolean;
    group: boolean;
    auditlog: boolean;
    staticdhcpleases: boolean;
    localdnsrecords: boolean;
    localcnamerecords: boolean;
    flushtables: boolean;
  };
  verbose: boolean;
  intervalMinutes: number;
  honeybadger_api_key: string | undefined;
} = {
  primary: {
    baseUrl: getRequiredEnv('PRIMARY_HOST_BASE_URL'),
    password: getRequiredEnv('PRIMARY_HOST_PASSWORD')
  },
  secondaries: getSecondaryHosts(),
  sync: {
    whitelist: process.env['SYNC_WHITELIST'] !== 'false',
    regex_whitelist: process.env['SYNC_REGEX_WHITELIST'] !== 'false',
    blacklist: process.env['SYNC_BLACKLIST'] !== 'false',
    regexlist: process.env['SYNC_REGEXLIST'] !== 'false',
    adlist: process.env['SYNC_ADLIST'] !== 'false',
    client: process.env['SYNC_CLIENT'] !== 'false',
    group: process.env['SYNC_GROUP'] !== 'false',
    auditlog: process.env['SYNC_AUDITLOG'] === 'true',
    staticdhcpleases: process.env['SYNC_STATICDHCPLEASES'] === 'true',
    localdnsrecords: process.env['SYNC_LOCALDNSRECORDS'] !== 'false',
    localcnamerecords: process.env['SYNC_LOCALCNAMERECORDS'] !== 'false',
    flushtables: process.env['SYNC_FLUSHTABLES'] !== 'false'
  },
  verbose: process.env['VERBOSE'] === 'true',
  intervalMinutes: (process.env['INTERVAL_MINUTES'] ? parseInt(process.env['INTERVAL_MINUTES']) : null) || 30,
  honeybadger_api_key: process.env['HONEYBADGER_API_KEY']
}

export interface Host {
  baseUrl: string;
  password: string;
}

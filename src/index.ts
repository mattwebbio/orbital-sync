import Honeybadger from '@honeybadger-io/js';
import chalk from 'chalk';
import sleep from 'sleep-promise';
import { log } from './log.js';
import { Client } from './client.js';
import { Config } from './config.js';

if (Config.honeybadger_api_key) {
  Honeybadger.configure({
    apiKey: Config.honeybadger_api_key
  });
}

while (true) {
  const primary = await Client.create(Config.primary);
  const secondaries = await Promise.all(
    Config.secondaries.map(secondary => Client.create(secondary))
  );

  const backup = await primary.downloadBackup();
  await Promise.all(
    secondaries.map(secondary => secondary.uploadBackup(backup))
  );

  log(chalk.dim(`Waiting ${Config.intervalMinutes} minutes...`));
  await sleep(Config.intervalMinutes * 60 * 1000)
}

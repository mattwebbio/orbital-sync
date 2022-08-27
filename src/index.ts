#!/usr/bin/env node

import Honeybadger from '@honeybadger-io/js';
import chalk from 'chalk';
import sleep from 'sleep-promise';
import { log } from './log.js';
import { Client } from './client.js';
import { Config } from './config.js';

if (Config.honeybadgerApiKey) {
  Honeybadger.configure({
    apiKey: Config.honeybadgerApiKey
  });
}

while (true) {
  const primary = await Client.create(Config.primaryHost);
  const secondaries = await Promise.all(
    Config.secondaryHosts.map((host) => Client.create(host))
  );

  const backup = await primary.downloadBackup();
  await Promise.all(secondaries.map((secondary) => secondary.uploadBackup(backup)));

  log(chalk.dim(`Waiting ${Config.intervalMinutes} minutes...`));
  await sleep(Config.intervalMinutes * 60 * 1000);
}

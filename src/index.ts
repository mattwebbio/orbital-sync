#!/usr/bin/env node

import Honeybadger from '@honeybadger-io/js';
import chalk from 'chalk';
import sleep from 'sleep-promise';
import { Client } from './client.js';
import { Config } from './config.js';
import { log } from './log.js';

if (Config.honeybadgerApiKey) {
  Honeybadger.configure({
    apiKey: Config.honeybadgerApiKey
  });
}

do {
  const primary = await Client.create(Config.primaryHost);
  const secondaries = await Promise.all(
    Config.secondaryHosts.map((host) => Client.create(host))
  );

  const backup = await primary.downloadBackup();
  await Promise.all(secondaries.map((secondary) => secondary.uploadBackup(backup)));

  log(chalk.dim(`Waiting ${Config.intervalMinutes} minutes...`));
  if (!Config.runOnce) await sleep(Config.intervalMinutes * 60 * 1000);
} while (!Config.runOnce);

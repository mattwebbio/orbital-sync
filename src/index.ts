#!/usr/bin/env node

import chalk from 'chalk';
import sleep from 'sleep-promise';
import { Log } from './log.js';
import { Sync } from './sync.js';
import { Config } from './config/index.js';
import { Version } from './config/version.js';

// need to do this to know how to parse the config
if (undefined === process.env.VERSION) {
  throw new Error('VERSION is required');
}
const version: Version | undefined = process.env.VERSION as unknown as Version;
if (undefined === version) {
  throw new Error(`VERSION must be one of ${Object.values(Version)}`);
}

const config = Config(version);

const log = new Log(config.verbose);

do {
  await Sync.perform(config, { log });

  if (!config.runOnce) {
    log.info(chalk.dim(`Waiting ${config.intervalMinutes} minutes...`));
    await sleep(config.intervalMinutes * 60 * 1000);
  }
} while (!config.runOnce);

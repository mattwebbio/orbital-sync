#!/usr/bin/env node

import { Sync } from './sync.js';
import { Config } from './config.js';

do {
  await Sync.perform();
} while (!Config.runOnce);

#!/usr/bin/env node

import { Sync } from './sync.js';
import { Config } from './config/environment.js';

do {
  await Sync.perform();
} while (!Config.runOnce);

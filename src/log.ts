import chalk from 'chalk';
import { Config } from './config.js';

export class Log {
  static info(message: unknown) {
    console.log(`${this.timestamp}: ${message}`);
  }

  static verbose(message: unknown) {
    if (Config.verboseMode && message) this.info(message);
  }

  static error(message: unknown) {
    console.error(`${this.timestamp}: ${chalk.red(message)}`);
  }

  private static get timestamp(): string {
    return chalk.dim(new Date().toLocaleString('en-US'));
  }
}

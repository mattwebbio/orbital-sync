import chalk from 'chalk';
import { Config } from './config.js';

export class Log {
  static info(message: unknown) {
    console.log(`${this.timestamp}: ${this.stringify(message)}`);
  }

  static verbose(message: unknown) {
    if (Config.verboseMode && message) this.info(this.stringify(message));
  }

  static error(message: unknown) {
    console.error(`${this.timestamp}: ${chalk.red(this.stringify(message))}`);
  }

  private static stringify(message: unknown): string {
    if (typeof message === 'string') return message;
    else return JSON.stringify(message);
  }

  private static get timestamp(): string {
    return chalk.dim(new Date().toLocaleString('en-US'));
  }
}

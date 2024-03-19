import chalk from 'chalk';

export class Log {
  constructor(public verboseMode: boolean) {}

  info(message: unknown) {
    console.log(`${this.timestamp}: ${this.stringify(message)}`);
  }

  verbose(message: unknown) {
    if (this.verboseMode && message) this.info(this.stringify(message));
  }

  error(message: unknown) {
    console.error(`${this.timestamp}: ${chalk.red(this.stringify(message))}`);
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') return message;
    else return JSON.stringify(message);
  }

  private get timestamp(): string {
    return chalk.dim(new Date().toLocaleString('en-US'));
  }
}

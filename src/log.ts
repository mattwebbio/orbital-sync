import chalk from 'chalk';

export function log(message: string) {
  console.log(`${chalk.dim(new Date().toLocaleString('en-US'))}: ${message}`);
}

import chalk from 'chalk';
import { DateTime } from "luxon";

export function log(message: string) {
  console.log(`${chalk.dim(DateTime.now().toFormat('F'))}: ${message}`);
}

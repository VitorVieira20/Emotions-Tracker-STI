import chalk from 'chalk';

function getTimestamp() {
  return chalk.dim(`[${new Date().toLocaleTimeString('en-GB', { hour12: false })}]`);
}

export const log = {
  start: (msg: string) => console.log(`${getTimestamp()} ${chalk.cyan('[START]')} ${msg}`),
  info: (msg: string) => console.log(`${getTimestamp()} ${chalk.blue('[INFO]')}  ${msg}`),
  success: (msg: string) => console.log(`${getTimestamp()} ${chalk.green('[SUCCESS]')} ${msg}`),
  skip: (msg: string) => console.log(`${getTimestamp()} ${chalk.yellow('[SKIP]')}    ${msg}`),
  error: (msg: string) => console.error(`${getTimestamp()} ${chalk.red('[ERROR]')}   ${msg}`),
  done: (msg: string) => console.log(`\n${getTimestamp()} ${chalk.bold.green('[DONE]')}    ${msg}`),
};

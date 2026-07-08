#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// The main CLI logic will be implemented here in future commits.

function main() {
  yargs(hideBin(process.argv))
    .scriptName("ek-unique-search")
    .usage('$0 <pattern> [file]', 'Search for a pattern in a file or from stdin, printing only unique matching lines.', (yargs) => {
      yargs
        .positional('pattern', {
          describe: 'Search string or regex pattern',
          type: 'string',
        })
        .positional('file', {
          describe: 'File to search (optional, reads from stdin if omitted)',
          type: 'string',
        });
    })
    .option('regex', {
      alias: 'r',
      type: 'boolean',
      description: 'Interpret pattern as a regular expression',
      default: false,
    })
    .option('ignore-case', {
      alias: 'i',
      type: 'boolean',
      description: 'Ignore case distinctions',
      default: false,
    })
    .help('h')
    .alias('h', 'help')
    .wrap(yargs.terminalWidth())
    .parse();
}

main();

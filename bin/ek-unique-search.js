#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import parseInput from '../lib/inputParser.js';
import { searchLines } from '../lib/search.js';
import { uniqueFilter } from '../lib/uniqueFilter.js';

/**
 * Print to stderr
 */
function printError(message) {
  process.stderr.write(message.endsWith('\n') ? message : message + '\n');
}

/**
 * Print usage (help) to stderr and exit
 */
function showUsageAndExit({ yargsInstance, message, exitCode = 1 }) {
  if (message) printError(message);
  yargsInstance.showHelp((s) => {
    process.stderr.write(s);
    return '';
  });
  process.exit(exitCode);
}

// Polyfill for checking if ran directly (works for ESM in node >=v14)
function isMain() {
  if (typeof require !== 'undefined' && require.main === module) return true;
  try {
    const mainArg = process.argv[1];
    if (!mainArg) return false;
    if (import.meta && import.meta.url) {
      const metaPath = import.meta.url.startsWith('file://') ? new URL(import.meta.url).pathname : import.meta.url;
      if (mainArg === metaPath) return true;
    }
  } catch (_) {}
  return false;
}

async function main() {
  // Setup yargs
  const y = yargs(hideBin(process.argv))
    .scriptName('ek-unique-search')
    .usage('$0 <pattern> [file]', 'Search for a pattern in a file or from stdin, printing only unique matching lines.', yargs => {
      yargs
        .positional('pattern', {
          describe: 'Search string or regex pattern',
          type: 'string',
        })
        .positional('file', {
          describe: 'File to search (optional; reads stdin if omitted)',
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
    .strict(false)
    .showHelpOnFail(false)
    .fail((msg, err, yargsInstance) => {
      if (err) {
        printError(err.message);
        process.exit(2);
      } else {
        showUsageAndExit({ yargsInstance, message: msg, exitCode: 1 });
      }
    });

  let argv;
  try {
    argv = y.parseSync();
  } catch (err) {
    process.exit(2);
  }

  // Handle help flag
  if (argv.help) {
    y.showHelp();
    process.exit(0);
  }

  // Check for pattern argument explicitly:
  if (typeof argv.pattern !== 'string' || argv.pattern.length === 0) {
    showUsageAndExit({ yargsInstance: y, message: 'Error: Missing required <pattern> argument.', exitCode: 1 });
  }
  const pattern = argv.pattern;

  const options = {
    regex: Boolean(argv.regex),
    ignoreCase: Boolean(argv['ignore-case'])
  };
  const file = argv.file;

  let foundAny = false;
  try {
    const lineIterable = parseInput(file);
    const matchedLines = searchLines(lineIterable, pattern, options);
    const uniqueLines = uniqueFilter(matchedLines);

    for await (const line of uniqueLines) {
      foundAny = true;
      process.stdout.write(line + '\n');
    }
    // If nothing matched, exit code 1
    if (!foundAny) {
      process.exit(1); // must exit directly for proper cli semantics
    }
  } catch (err) {
    if (err && err.message) {
      printError('Error: ' + err.message);
    } else {
      printError('Unknown error occurred.');
    }
    process.exit(2);
  }

  // If foundAny, exit 0 (process exit code is already 0)
}

if (isMain()) {
  main();
}

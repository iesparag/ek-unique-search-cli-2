# ek-unique-search-cli-2

A command-line tool to search text in files or standard input and output only unique matching lines.

Supports fixed string or regular expression search, case-insensitive option, file or stream input, and solid error handling. 100% tested.

Repository: https://github.com/iesparag/ek-unique-search-cli-2

## Features

- **Search files or stdin for a string or regex pattern**
- **Prints only unique matching lines** (each line printed once, no duplicates)
- **Case-insensitive search option** (`-i`)
- **Regex mode** (`-r`) or simple substring (default)
- **Errors and usage info when input or args are invalid**
- **Works with big files/streams (memory-safe)**

## Installation

### 1. As a global CLI (recommended)

Install globally via npm:

```
npm install -g ek-unique-search-cli-2
```

Now you can use the command `ek-unique-search` from anywhere.

### 2. Via npx (no install)

For quick, one-off use:

```
npx ek-unique-search-cli-2 "pattern" [file]
```

### 3. As a dev dependency

```
npm install --save-dev ek-unique-search-cli-2
```

Call with `npx ek-unique-search` or add to your scripts.

## Usage

```
ek-unique-search <pattern> [file] [options]

Options:
  -r, --regex        Interpret <pattern> as a regular expression
  -i, --ignore-case  Case-insensitive match
  -h, --help         Show usage help
```

- **<pattern>** - the string or regex to search for (required)
- **[file]**     - name of the file to search (optional); reads from stdin if omitted

## Examples

### Example 1: Search a file for a string (only unique matches)

```sh
ek-unique-search foo sample.txt
```

Matches all lines in `sample.txt` containing `foo` (case-sensitive), outputs each unique matching line once.

### Example 2: Regex search (case-insensitive)

```sh
ek-unique-search -r -i "^error.*code\\d" logs.txt
```

Find all unique lines starting with "error" (any case), containing "code" then a digit, in `logs.txt`.

### Example 3: Pipe input (stdin)

```sh
cat mydata.txt | ek-unique-search "failed"
```

Prints all unique lines containing "failed" from the piped input.

### Example 4: Regex on stdin

```sh
cat data.txt | ek-unique-search -r "[A-F0-9]{8}"
```

Lists all unique lines with an 8-digit hex code.

### Example 5: Case-insensitive fixed string

```sh
ek-unique-search -i "ERROR" logs.txt
```

Finds lines containing "error" (any case).

### Example 6: Show help

```sh
ek-unique-search --help
```

## Flags & CLI Options

| Flag           | Alias | Description                                               |
|:-------------- |:----- |:---------------------------------------------------------|
| `<pattern>`    |       | Search string or regex pattern                            |
| `[file]`       |       | File to search (reads stdin if omitted)                   |
| `-r`           | `--regex` | Use regex matching instead of substring search    |
| `-i`           | `--ignore-case` | Ignore case                                  |
| `-h`           | `--help` | Print usage help                                     |

## Output

- **If matches found:** All unique matching lines (in original order) printed to stdout.
- **If no match:** Exit code is 1, prints nothing.
- **If an error occurs:** Error message to stderr, exit code 2.

## Exit Codes

| Code | Meaning                                     |
|------|---------------------------------------------|
| 0    | Found at least one matching line             |
| 1    | No matches found                            |
| 2    | Error in arguments, file, or pattern         |

## Error Handling

- If the input file doesn't exist or can't be read: prints error, exit 2
- If regex pattern is invalid: prints error, exit 2
- If no input is provided (neither file nor piped data): prints error, exit 2
- If the pattern argument is missing: prints usage, exit 1

## Edge Cases Handled

- Trailing blank lines and unique filtering (handles lines that are empty)
- Duplicate matching lines only output once
- Stdin TTY/empty detection (shows helpful error)
- Large files/streams safe (streams line-by-line)
- Differentiates between empty string, whitespace lines, etc.

## Programmatic Usage?

This package is a CLI tool. For library usage, import `lib/search.js`, `lib/inputParser.js`, `lib/uniqueFilter.js` (see source).

## Development & Testing

- Requires Node.js 16+
- All logic is covered by tests (see `/tests`)

Install dependencies:

```
npm install
```

To run all tests:

```
npm test
```

The main executable is at `bin/ek-unique-search.js` and is made executable (`chmod +x`) in the published package.

### Lint/Style

Consistent modern JS style with ES modules. Lint using your favorite linter or IDE autoformat.

## License

MIT

## Author

Parag Ies, 2024

---

## Deployment

(n/a for CLI packages, but for workflow completeness:)

- No backend service or frontend is provided, and this CLI is not designed for web hosting, so no Railway/Vercel deployment config.

## Contributing

PRs and feedback welcome. All code must pass existing test suite before merging.

# Architecture

### Components and Folder Structure

- **bin/ek-unique-search.js**: CLI executable entry point, parses command line args and runs main logic.
- **lib/inputParser.js**: Provides async iterable line-by-line reading from file or stdin.
- **lib/search.js**: Contains searchLines() that filters lines by pattern, respecting regex and ignore-case options.
- **lib/uniqueFilter.js**: Filters out duplicate lines from input async iterable.
- **tests/**: Unit tests for each lib module.

### Data Flow

User invokes CLI → arguments parsed → input lines read from file/stdin → lines filtered by pattern → unique filter applied → results output to stdout → errors or usage info on stderr

### Key Decisions

- Language: Node.js ES modules for cross-platform compatibility and ease of testing.
- Async iterables for memory-efficient streaming of large files.
- Use yargs for robust CLI argument parsing.
- Filtering uniqueness via an in-memory Set, feasible given line-based streaming.
- CLI output and errors separated (stdout/stderr).
- Testing uses built-in node:test (no external test framework).

### Folder Structure

```
ek-unique-search-cli/
  bin/
    ek-unique-search.js
  lib/
    inputParser.js
    search.js
    uniqueFilter.js
  tests/
    inputParser.test.js
    search.test.js
    uniqueFilter.test.js
  package.json
  README.md
  .gitignore
  .env.example
```


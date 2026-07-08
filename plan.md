# Build plan

### Issue 1: Setup project structure and dependencies
- Initialize Node.js project with ES modules.
- Add yargs for CLI parsing.
- Set up bin/, lib/, tests/ folders.
- Create package.json with scripts including "test" using node --test.
- Add .gitignore, README.md stub, .env.example.

### Issue 2: Input reading from file or stdin
- Implement lib/inputParser.js providing async iterable to read lines from a file or stdin.
- Handle errors for missing file or reading issues.
- Write unit tests with mocks for file and stdin.

### Issue 3: Basic fixed-string search implementation
- Implement lib/search.js to filter lines matching fixed string pattern.
- Support options for ignore-case.
- Write tests for matching and no matches.

### Issue 4: Unique filtering of matched lines
- Implement lib/uniqueFilter.js to filter duplicates in async iterable.
- Test with repeated lines to ensure output uniqueness.

### Issue 5: Extend search with regex support
- Add regex flag option parsing in CLI.
- Extend searchLines to accept regex patterns, validate regex with try/catch.
- Add tests for regex matching, invalid regex errors.

### Issue 6: CLI argument parsing and end-to-end flow
- Implement bin/ek-unique-search.js executing the flow:
  parse args → open input → perform search → unique filter → output lines
- Implement error handling (bad file, bad regex, missing pattern) with exit codes.
- Add usage/help display.
- Integration tests simulating CLI runs with child process.

### Issue 7: Documentation, tests completion, and packaging
- Finalize README with usage examples, installation and usage instructions.
- Ensure coverage of edge cases in tests.
- Mark CLI script executable.
- Verify linting and consistent style.

### Issue 8: Deployment configuration and README update
- Add no deployment config (CLI only).
- Update README deployment section noting installation via npm or npx.

Each issue delivers a fully functional user-facing feature or core module end-to-end, including implementation, tests, and documentation as needed.

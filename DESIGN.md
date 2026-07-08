# Design analysis

# Design Analysis for Project: "ek unique kuch bnao search kro" (CLI tool)

---

## 1. Restated Requirements, Project Type, and Assumptions

### Restated Requirements
- Build a *unique* CLI tool related to "search".
- The phrase "ek unique kuch bnao search kro" roughly translates from Hindi/Urdu as:  
  "*Make something unique, search*."  
- The request is minimalistic and emphasizes uniqueness and search functionality.
- The domain is explicitly CLI tools.
- No UI requested, so no frontend needed.

### Project Type
- **CLI tool only** (no frontend, no backend server).  
- The tool will be an executable command-line utility.

### Assumptions
- The CLI tool should provide a unique or novel search-related functionality.
- Search could be for files, text within files, or unique data among inputs.
- Since the brief is minimal, interpret “unique” as a core feature — e.g., searching and returning only unique matches or uniquely formatted results.
- Tool will be developed for typical Unix-like environments (Linux, macOS), possibly Windows with minimal changes.
- Written in a popular, suitable language for CLI tools (e.g., Python, Node.js, Go). Language choice affects testing and architecture.
- Data source for search: Local file system or user input.

---

## 2. Core Domain Entities and Data Model

Because this is a CLI tool without persistence or complex entities, the domain revolves around input data, search queries, and output results.

### Entities

| Entity       | Description                                             | Fields/Attributes                         |
|--------------|---------------------------------------------------------|-------------------------------------------|
| Search Input | Source on which search is performed                      | - Input type (file, directory, stdin)     |
| Query       | Search criteria or pattern                               | - Search string or regex                   |
| Search Result| Matching items found by search                           | - Matched lines/items                      |
| Unique Filter| Logic/module to filter only unique matches              | - Comparison logic for uniqueness          |

### Data Model

- Input data: lines or files scanned.
- Search query: string or pattern.
- Matching results: array/list of strings.
- Unique filter applied on results to produce final output.

No relational data or persistent storage required.

---

## 3. Architecture and Folder Structure

### Architecture

- Standalone CLI tool executable.
- Single component that:
   - Accepts input (CLI arguments and pipes)
   - Performs search on input data
   - Filters unique results (core unique feature)
   - Outputs results to stdout

### Data Flow:

```
User CLI invocation ->
  Parse arguments (search term, input path) ->
  Load input text/file(s) ->
  Perform search (string or regex matching) ->
  Extract unique matches (no duplicates) ->
  Print results
```

### Folder Structure (Example for Node.js):

```
/project-root
  /bin
    ek-unique-search.js   # Entry point CLI script, executable
  /lib
    search.js             # Search functions
    uniqueFilter.js       # Uniqueness logic
    inputParser.js        # Input handling (file/stdin)
  /tests
    search.test.js
    uniqueFilter.test.js
    inputParser.test.js
  package.json
  README.md
```

---

## 4. Key User Flows and API Surface

### User Flows (CLI usage)

- **Flow A: Search within a file**
  - User runs: `ek-unique-search "pattern" filename.txt`
  - Tool reads file, searches lines matching "pattern", filters unique matches, outputs them.

- **Flow B: Search with piped input**
  - `cat largefile.txt | ek-unique-search "pattern"`
  - Tool reads from stdin line-by-line, filters matches uniquely, outputs.

- **Flow C: Search using regex flag**
  - `ek-unique-search -r "regex_pattern" filename.txt`
  - Enables regex searching instead of fixed string.

- **Flow D: Search ignoring case**
  - `ek-unique-search -i "Pattern" filename.txt`
  - Case-insensitive search.

### Command-line Arguments:

| Arg           | Description                   |
|---------------|-------------------------------|
| `<pattern>`   | Search string or regex pattern|
| `<file>`      | Optional file path input      |
| `-r/--regex`  | Interpret pattern as regex    |
| `-i/--ignore-case` | Case-insensitive search  |
| `-h/--help`   | Show usage instructions       |

### Internal API Methods (module functions):

- `parseInput(pathOrStdin): Async Iterable<string>` - Reads lines from file or stdin.
- `searchLines(linesIterator, pattern, options): Async Iterable<string>` - Filters lines matching pattern.
- `uniqueFilter(linesIterator): Async Iterable<string>` - Filters out duplicate lines.
- `main(args): Promise<void>` - CLI entry point.

---

## 5. Edge Cases, Failure Modes, and Handling

### Edge Cases:

- Empty input file or stdin → Output nothing, possibly show "No matches found".
- No matches found for the pattern → Output "No matches found".
- Invalid file path → Show error and exit cleanly.
- Invalid regex pattern → Show regex compile error.
- Large input files/streams → Process line-by-line to avoid memory blowup.
- No pattern provided → Show usage instructions/error.
- Binary files or non-text input → Detect and handle gracefully (skip or error).
- Duplicate lines in input → Ensure unique filtering works reliably.

### Failure Modes:

- File read error → Clear error message.
- Invalid arguments → Show usage help.
- Unexpected exceptions → Catch and log error, exit with non-zero code.

### Frontend States (CLI):

- Loading: Stream input asynchronously, no explicit loading message needed per CLI norms.
- Empty: Print "No matches found" or no output.
- Error: Print to stderr with descriptive error.
  
---

## 6. Security, Validation, and Configuration

### Security

- No external calls or network operations anticipated.
- Basic validation of input parameters to prevent crashes.
- Avoid risky eval or unsafe regex usage.
- Ensure that input streams are properly handled to avoid resource exhaustion.

### Validation

- Validate regex patterns at program start with try/catch.
- Validate file existence and readability.
- Validate argument count and correctness.

### Configuration

- Use CLI arguments only, no external config file.
- Optionally support environment variables if extended in future.

---

## 7. Testing Strategy

### Backend Tests

- Unit tests for:
  - Input parser (file and stdin mocks)
  - Search functionality (plain string, regex, ignore case)
  - Unique filter correctness (on repeated lines)
- Integration tests simulating CLI invocation with various args.
- Error handling tests (invalid args, bad file, invalid regex).

### Frontend Testing

- N/A (CLI tool, but ensure the `bin` executable builds/runs without errors).

### Build & CI

- Ensure command runs without errors.
- Linting to enforce code quality.
- Tests run cleanly with coverage reports.

---

## 8. Incremental Build Approach

1. **Setup CLI skeleton with argument parsing**
   - Use standard CLI libraries (e.g. yargs for Node.js).
   - Handle help and usage display.

2. **Implement input reading module**
   - Support reading from file and stdin asynchronously.
   - Write simple test for input reading.

3. **Implement basic search for fixed string pattern**
   - Perform line-by-line matching.
   - Add tests for line matching.

4. **Implement unique filtering on matched lines**
   - A set to track seen results.
   - Test unique filter extensively.

5. **Add regex and ignore-case flags**
   - Extend search module.
   - Validate regex compilation.
   - Add tests.

6. **Error handling and user feedback**
   - File not found.
   - Invalid regex.
   - No matches.

7. **Testing and documentation**
   - Complete tests.
   - Write README with usage examples.

8. **Packaging and distribution**
   - Make CLI tool executable.
   - Publish package if relevant.

---

# Summary

This project will be a minimalistic but clever CLI tool that reads input from files or stdin, searches for a user-provided pattern with options, and outputs only unique matching lines. It will handle edge cases gracefully with clear error handling, support regex and case-insensitive searches, and provide a clean developer experience with rigorous unit and integration tests.

The design respects the user's brief to build exactly a unique search tool in CLI format, focussing exclusively on this domain without frontend complexity.

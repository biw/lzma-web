# Performance Tracking

This project includes several tools to track and measure test performance over time.

## Quick Start

### Track Benchmark Performance Over Time

Run benchmarks and log timing data to a CSV file:

```bash
pnpm test:perf
```

This will:

- Run all benchmarks (~20+ different scenarios)
- Record the duration, number of benchmarks, avg ops/sec, and git commit
- Append to `test-performance.csv`
- Show recent history

Example output:

```
📊 Performance tracked:
   Duration: 70402ms (70.40s)
   Benchmarks: 39 ran
   Avg ops/sec: 8234.56
   Commit: a1b2c3d
   Log: test-performance.csv

📈 Recent runs:
   10:30:45 PM - 70402ms (39 benchmarks, 8234.56 avg ops/sec) [a1b2c3d]
   10:25:12 PM - 72103ms (39 benchmarks, 8145.23 avg ops/sec) [a1b2c3d]
   10:20:33 PM - 71891ms (39 benchmarks, 8189.45 avg ops/sec) [9f8e7d6]
```

### Run Benchmarks

For more detailed performance testing of specific functions:

```bash
pnpm test:bench
```

This benchmarks **all test files** across different scenarios:

- All decompression operations (~20+ compressed files)
- Compression at modes 1, 5, 9 for key file types (text, binary, unicode, time series)
- Files ranging from 8 bytes to 4MB
- Different compression levels (level 1-9)

Example output shows ops/second for each scenario, helping you spot performance regressions.

### View Detailed Test Timing

The default test command now shows detailed timing for each test:

```bash
pnpm test
```

With the verbose reporter enabled, you'll see:

```
✓ tests/test.ts (39 tests) 15547ms
  ✓ Doing async tests (39 tests)
    ✓ testing compression/decompress of large-kjv.txt 4527ms
    ✓ testing decompression of large-kjv.txt.lzma 898ms
    ✓ testing compression/decompress of large-random_binary 4493ms
    ...
```

### JSON Output

Tests also output to `test-results.json` which can be used for CI/CD integration or custom analysis.

## Tracking Changes

### Best Practices

1. **Run `test:perf` before and after changes** to see the impact:

   ```bash
   pnpm test:perf  # Before changes
   # Make your changes...
   pnpm test:perf  # After changes
   ```

2. **Review the CSV file** to see trends over time:

   ```bash
   cat test-performance.csv
   ```

3. **Use benchmarks** for specific optimizations:
   - Add new benchmark tests in `tests/*.bench.ts`
   - Focus on the specific functions you're optimizing
   - Compare before/after results

### Analyzing Results

The CSV file (`test-performance.csv`) has these columns:

- `timestamp`: ISO timestamp of the benchmark run
- `duration_ms`: Total benchmark duration in milliseconds
- `benchmarks_run`: Number of benchmarks executed
- `avg_ops_per_sec`: Average operations per second across all benchmarks
- `git_commit`: Git commit hash (short)

You can analyze this with any spreadsheet software or command-line tools:

```bash
# Show average duration over last 10 runs
tail -10 test-performance.csv | awk -F',' '{sum+=$2; count++} END {print sum/count}'

# Find slowest run
tail -n +2 test-performance.csv | sort -t',' -k2 -nr | head -1
```

## GitHub PR Integration

### Automatic Benchmark Comparison

The project includes a GitHub Actions workflow that **automatically runs benchmarks on every PR** and posts a comparison table as a comment.

When you open a PR, the workflow will:

1. Run all benchmarks on the PR branch
2. Run the same benchmarks on `main`
3. Calculate percentage changes
4. Post a comment with a detailed comparison table

**Example PR Comment:**

```markdown
## 📊 Benchmark Comparison

Comparing 18 benchmarks between main and this PR.

### Performance Changes

| Benchmark                         | Main (ops/sec) | PR (ops/sec) | Change    | Mean (ms) | Change    |
| --------------------------------- | -------------- | ------------ | --------- | --------- | --------- |
| decompress binary.lzma            | 364.56         | 380.23       | 🟢 +4.30% | 2.74      | 🟢 -4.12% |
| decompress chinese.txt.lzma       | 250.87         | 245.12       | 🔴 -2.29% | 3.99      | 🔴 +2.35% |
| decompress large-kjv.txt.lzma     | 1.36           | 1.38         | +1.47%    | 733.01    | -1.45%    |
| compress sample_text.txt (mode 1) | 12.34          | 13.01        | 🟢 +5.43% | 81.05     | 🟢 -5.15% |
| compress sample_text.txt (mode 5) | 8.91           | 8.76         | 🔴 -1.68% | 112.25    | 🔴 +1.71% |

...

### Summary

- **Average performance change**: 🟢 +2.15%
- **Improvements** (>1%): 8
- **Regressions** (<-1%): 3
- **Neutral** (±1%): 7

✅ Overall performance looks good!
```

**Color indicators:**

- 🟢 Green = Performance improvement (faster)
- 🔴 Red = Performance regression (slower)
- No color = Change < 1% (neutral)

### Running Locally

You can test the comparison script locally:

```bash
# Run benchmarks on your current branch
pnpm test:bench --reporter=json > pr-results.json

# Switch to main
git checkout main

# Run benchmarks on main
pnpm test:bench --reporter=json > main-results.json

# Switch back
git checkout -

# Compare
node scripts/compare-benchmarks.js
```

This creates `benchmark-comparison.md` with the comparison table.

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/benchmark-pr.yml`) is already set up. It will:

- Automatically run on all PRs to `main`
- Post benchmark comparisons as PR comments
- Update the comment if you push new commits

No additional setup required!

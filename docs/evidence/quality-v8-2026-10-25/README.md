# Five deferred checks completed, 25 October 2026

All five targeted Groq operations completed and passed all 166 declared content checks: detailed school Update (53), Riverside Prepare (29) and Update (28), ambiguous-date Oak Prepare (28), and community Update (28). All 20 standalone PDF protocol probes passed and all five application/approval checks passed. No provider failure or quota response occurred. Sample-pack PDF separately returned HTTP 200 and a valid PDF signature.

These are exposed regression cases with unchanged expectations, not an independent or general reliability estimate. The runner froze the repository source at ff9ac9d01677b78aa726983870e863231e1f9144 before inference; it does not test the later candidate-finish fallback correction. That correction is covered by the 146-test local suite. No new live Google generation or human-effort measurement was performed.

The gzip archive contains a JSON map from original filenames to their full text: per-operation raw results, receipts, exported-file metadata, templates and summary. Prior v7 failures remain untouched. To inspect, decompress then parse JSON; the original summary is stored under summary.json. PDF probes check response type/header, not visual layout.

Archive SHA-256: bfef6c54f85aa781092e842b0d990b73e8a7c7b516e0ab7d5ebdf7480fdf75d8

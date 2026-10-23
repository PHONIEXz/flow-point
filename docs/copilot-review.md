# GitHub Copilot review: PDF download filenames

Date: 23 October 2026
Change: [pull request #1](https://github.com/PHONIEXz/flow-point/pull/1)

## Actual use

GitHub Copilot Chat on GitHub.com inspected the pull request's changed files and surrounding repository source. Its UI showed retrieval of the PR files and additional file reads. A formal Copilot PR-review request returned successfully through the API but did not register an assigned reviewer or review; the actual contribution described here came from Copilot Chat.

The task asked for concrete correctness issues covering event-title preservation, Unicode, Windows filenames, Content-Disposition, injection, length limits, uniqueness, browser parsing, and consent/draft regressions. No credentials or live event data were supplied.

## Findings and evaluation

1. **Malformed Unicode could break PDF export.** Copilot identified the unguarded encodeURIComponent call for an unpaired UTF-16 surrogate such as a title containing "\\uD800". A manual check had independently reproduced this while the review was running. Copilot called the resulting response HTTP 500; the reproduction actually returned HTTP 400 through the application's generic validation handler. The filename now calls toWellFormed before normalization/encoding. A regression case checks that this input exports successfully.
2. **The browser accepted decoded filename suggestions without its own checks.** Copilot proposed a header containing encoded path separators and a null byte as a reproduction. The application's server already sanitizes names and browsers apply their own download rules, so this was treated as defense in depth rather than a demonstrated filesystem traversal exploit. A shared browser helper now rejects reserved characters, controls, bidi controls, reserved device names, excessive UTF-8 length and mismatched extensions, using the safe ASCII or generated fallback.

Copilot reported no consent or draft-preservation regression in the changed paths. That is limited review feedback, not proof of absence of defects.

## Verification

All 38 local automated tests passed. Filename cases include readable event titles, accented and Nigerian-language characters, malformed surrogate data, four-byte emoji, Windows-reserved names, long titles, repeated exports, malformed percent encoding, unsafe header suggestions and wrong extensions.

This review supplements the project's generation and human-review workflow; Gemma remains the application's inference model. No claim is made that Copilot built the whole project or that its suggestions were accepted without evaluation.

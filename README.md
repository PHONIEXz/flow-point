# Flow Point

**From a messy event request to a reviewed preparation pack.**

Flow Point is a new project for the Hacktoberfest 2026 Week 3 challenge, Slow and Steady. It is being built by Paul Ayoade David ([PHONIEXz](https://github.com/PHONIEXz)).

## Current status

This is the project foundation, not a completed AI application. The first implementation includes a structured event-plan validator, missing-information checks, date/weekday checks, integer budget arithmetic, version-specific approval records, a Markdown pack exporter, a spreadsheet-safe CSV exporter, and a labelled example fixture. There is no web interface, live inference, account system, or deployed demo yet.

The intended AI is hosted Gemma. The intended deployment is Render. The default agent framework is eve; its initial package installation could not complete in the build environment, so no framework APIs have been guessed or included. The dependency-free core can be tested now and integrated into the agent runtime next.

## Run the foundation

Requires Node.js 22 or newer. There are no third-party dependencies in this initial commit.

```sh
npm test
npm run demo
```

The demo prints a hand-authored example. It does not call a model and must not be presented as evidence of AI output.

## The MVP

1. Paste a rough event request.
2. Extract facts, show missing details and resolve conflicting dates.
3. Prepare an invitation, run of show, checklist and budget.
4. Review and edit the pack; require renewed approval after an edit.
5. Export a usable pack.

The model handles interpretation and drafting. Code handles validation, arithmetic and export. A generated draft still requires a person to check its facts and wording. The current structural checks cannot prove that the model faithfully extracted every fact from the original request.

See [the MVP specification](docs/mvp.md), [domain plan](docs/domains.md), and [evaluation plan](docs/evaluation.md).

## Open innovation

Gemma will be central to extracting the event plan and drafting its contents. The implementation will document the exact model and provider used. A hosted model does not make this app offline or keep inputs entirely on the user's machine. Model swapping/local inference is future work until implemented and tested.

## Project domain

Proposed: `flowpoint.phoenixreborn.tech`, under the shared `phoenixreborn.tech` project domain. No DNS or hosting changes have been made.

## Competition evidence

Challenge: https://dev.to/challenges/hacktoberfest-week3-2026-10-19

Target categories: Gemma, Render, and a .tech Domain, subject to actual implementation and eligibility. Do not claim a category merely because it appears in this plan. Record real inference runs, failure cases, measured user effort and the deployed commit before writing the submission. Mark any changes made after the contest deadline in this README.

## License

MIT. Copyright (c) 2026 Paul Ayoade David. Upstream models and dependencies retain their own licenses and terms.

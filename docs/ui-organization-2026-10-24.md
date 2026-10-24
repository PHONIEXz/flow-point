# Interface organization update

Requested 24 October 2026 after the owner supplied a screenshot of the expanded generation evidence panel. The prior panel displayed three model names, timings, attempt counts and long references in one paragraph. The Home Preview badge belonged to the Home link, so clicking it navigated to the same page.

## Changes

- Generation evidence now has three summary tiles, separate step cards, expandable references and Copy reference buttons.
- Separate fieldsets for event/document facts and date/place. Collapsible amber review panel, boxed questions/tasks/budget entries, clearer destructive and resolution controls, and contextual allowance colours.
- Separate review/approval and download cards. Notes has a dedicated AI-processing card; examples/help and saved packs are grouped. Shared spacing and light/dark surfaces apply to Home, Notes, Pack and Judge guide.
- Home has a distinct Preview sample link targeting the interactive sample with working section tabs and PDF/Markdown downloads. It no longer belongs to the Home brand link.
- The guide uses section cards, boxed steps and a working Copy update control. Its instructions identify the new Examples & help disclosure.

## Verification

79 automated tests pass. Browser checks on the live release verified Preview navigation to `/#example`, the Budget preview panel, guide Copy update feedback, separate evidence step cards, reference disclosure/copy feedback, spending-limit persistence across reload, and fresh Prepare/Update on a fictional community event. The sample was saved before a new blank workspace was created. Existing nontrivial work was not overwritten.

Light and dark desktop views were inspected. The pack view had no horizontal overflow at the observed 1,363 CSS-pixel viewport. Narrow-width CSS is supplied; this is not a physical-phone test. The initial browser PDF download reported success but its nested file did not synchronize into the executor, so that attempt is not counted as an inspected downloaded document.

The community run's budget and pending question were correct, but manual review caught a schedule clock-arithmetic error. This is preserved in `docs/evidence/chunk-1-community-browser-2026-10-24.json`; the follow-up timing check must not be represented as an independent unseen evaluation. Large-school Update verification separately remains blocked by provider HTTP 500/503.

## Final release check

Commit `85d4b5891cce97d577e8ba37eaf1eb77f229a227` became live in Render deployment `dep-dbe6c4bncjis73d5iga0`. A live `/api/review` check returned `SCHEDULE_DURATION` for 14:25 + 30 minutes followed incorrectly by 14:50, with the expected 14:55 in the message. Reloading the existing community pack also showed this additional actionable review item; the existing pack was preserved and approval remained blocked. This verifies the new guard, not a new successful model generation.

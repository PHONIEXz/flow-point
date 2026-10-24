# Individual document PDF exports

24 October 2026. Requested before Chunk 4.

Each document tab has a PDF-only download button: Invitation, Run of show, Preparation checklist and Budget. The PDF body contains that section, with the event title, natural document heading, current whole-pack draft/approval status and page numbers. Unrelated document text is excluded. Budget PDFs preserve unknown prices, exact totals and allowance semantics; checklist PDFs preserve owners and due dates. Draft exports do not bypass approval.

Unicode event titles and natural section labels are preserved in filenames, subject to filesystem-safe character replacement and length bounds. Draft names include Draft; each download retains a timestamp/random suffix to prevent collisions. Example pattern: `Maple Reading Morning - Budget - Draft - <unique suffix>.pdf`. Full-pack PDF/Markdown and budget CSV remain available. Section requests with invalid names or non-PDF formats are rejected.

100 automated tests passed. New HTTP checks cover all four sections, filenames, repeat-download uniqueness, approval invalidation, invalid section keys and unsupported formats. Visual verification rendered and inspected each of the four one-page sample documents; text extraction checked section isolation. A 60-line budget generated four pages; first/final page renders confirmed repeated headings, rows, totals and footer placement. These PDF fixtures are hand-authored, not model-quality evidence. Live UI verification follows deployment.

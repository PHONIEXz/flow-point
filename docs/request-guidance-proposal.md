# Event-request guidance proposal

Owner proposed greeting/question recognition on 24 October. This is a proposal, not implemented or deployed.

Use a conservative local preflight check for empty input and pure greetings, mirrored on the server before quota/model dispatch. Do not send obvious greetings to a paid or quota-limited model. Do not reject short valid briefs, non-English event notes or a greeting followed by event details. A date/time/quantity-only Update must use the existing pack context.

For uncertain inputs, extend the existing facts step with an explicit event / needs-details / unrelated result rather than add a separate model call. Do not coerce a greeting into an empty four-document pack. Show guidance inline, retain typed notes and the previous complete pack, and stop later generation stages. Provide Use an example and Open sample pack actions. Validate on Prepare/Update, not aggressively on every keystroke. Missing date/venue alone does not make a request invalid; existing clarification questions remain appropriate.

Suggested message: Tell us about the event you want to plan. Share its name, purpose or audience, and anything else you know. You can start with an example below.

Tests should distinguish pure greeting, unrelated question, random text, short event request, greeting plus event, incomplete event details and a short contextual Update. Model classification quality needs live tests when capacity returns. This proposal does not change the frozen current evaluation or count as completed Chunk 4/5 work.

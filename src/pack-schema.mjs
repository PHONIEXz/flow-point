// A data-only function declaration. No function or external action is executed.
const string = { type: 'STRING' };
const unknownString = { type: 'STRING', nullable: true };
const object = properties => ({ type: 'OBJECT', properties, required: Object.keys(properties) });
const array = items => ({ type: 'ARRAY', items });
export const packFunction = {
  name: 'submit_event_pack',
  description: 'Return the complete event preparation pack for validation and human review. This records draft data only; it sends no messages and makes no bookings.',
  parameters: object({
    title: { ...string, description: 'Supplied event name only. Exclude request commands such as Prepare or Create a pack for.' },
    eventDate: unknownString,
    requestedWeekday: unknownString,
    venue: { ...unknownString, description: 'Single supplied requested or proposed location name, even if booking is pending. Booking approval stays a separate open question. Null only if no single location is supplied.' },
    startTime: { ...unknownString, description: 'Latest supplied programme start in 24-hour HH:MM. Registration and rehearsal times are separate. Preserve a confirmed start through updates; null only if unknown or awaiting approval.' },
    organizer: unknownString,
    signatory: unknownString,
    currency: string,
    spendingLimitMinor: { type: 'INTEGER', nullable: true, description: 'Explicit total spending limit in integer minor units. Null if not supplied. Preserve unchanged limits through updates. Do not calculate remaining allowance here.' },
    tasks: array(object({ label: string, owner: unknownString, dueDate: unknownString })),
    budget: array(object({ label: string, quantity: { type: 'INTEGER' }, unitCostMinor: { type: 'INTEGER', nullable: true } })),
    drafts: object({ invitation: string, schedule: string }),
    openQuestions: array(string)
  })
};

export function stageFunction(stage) {
  if (stage === 'facts') {
    const { drafts, ...properties } = packFunction.parameters.properties;
    const described = { ...properties,
      sourceQuotes: array(object({ path: { ...string, description: 'Exact field path, e.g. venue, tasks.0.owner, budget.0.quantity or budget.0.unitCostMinor.' }, source: { type: 'STRING', enum: ['notes','update'] }, quote: { ...string, description: 'Exact short substring copied from original request (notes) or latest answers (update), maximum 320 characters. Never invent or paraphrase a quote.' } })),
      title: { ...string, description: 'Supplied event name only, excluding request instructions such as Prepare or Create a pack for.' },
      organizer: { ...unknownString, description: 'Supplied school or organizing group name, copied accurately. Null if unknown.' },
      signatory: { ...unknownString, description: 'The actual supplied invitation signer name and role, Never the word signatory. Null only if not supplied.' },
      venue: { ...unknownString, description: 'Single supplied requested or proposed location name. Retain its name even if booking is pending; keep booking approval as a separate open question. Null only if no single location is supplied.' }
    };
    return { name: 'submit_event_facts', description: 'Return event facts, checklist, budget and open questions only. No prose drafts.', parameters: object(described) };
  }
  if (['invitation', 'schedule'].includes(stage)) return { name: `submit_event_${stage}`, description: `Return only the ${stage} draft, using the supplied event facts.`, parameters: object({ [stage]: string }) };
  return packFunction;
}

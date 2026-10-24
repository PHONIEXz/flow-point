// A data-only function declaration. No function or external action is executed.
const string = { type: 'STRING' };
const unknownString = { type: 'STRING', nullable: true };
const object = properties => ({ type: 'OBJECT', properties, required: Object.keys(properties) });
const array = items => ({ type: 'ARRAY', items });
export const packFunction = {
  name: 'submit_event_pack',
  description: 'Return the complete event preparation pack for validation and human review. This records draft data only; it sends no messages and makes no bookings.',
  parameters: object({
    title: string,
    eventDate: unknownString,
    requestedWeekday: unknownString,
    venue: unknownString,
    startTime: unknownString,
    organizer: unknownString,
    signatory: unknownString,
    currency: string,
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
      title: { ...string, description: 'Exact supplied event title, not the word title.' },
      organizer: { ...unknownString, description: 'Supplied school or organizing group name, copied accurately. Null if unknown.' },
      signatory: { ...unknownString, description: 'The actual supplied invitation signer name and role, Never the word signatory. Null only if not supplied.' },
      venue: { ...unknownString, description: 'Actual venue name. Keep an unconfirmed booking as an open question.' }
    };
    return { name: 'submit_event_facts', description: 'Return event facts, checklist, budget and open questions only. No prose drafts.', parameters: object(described) };
  }
  if (['invitation', 'schedule'].includes(stage)) return { name: `submit_event_${stage}`, description: `Return only the ${stage} draft, using the supplied event facts.`, parameters: object({ [stage]: string }) };
  return packFunction;
}

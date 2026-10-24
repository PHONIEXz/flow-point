// Deterministic missing-input prompts. Never fill a missing price or change a fact.
const tokens=value=>String(value).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.map(w=>w.endsWith('s')?w.slice(0,-1):w)||[];
export function completePriceQuestions(plan){
 const openQuestions=[...plan.openQuestions],added=[];
 for(const item of plan.budget){
  if(item.unitCostMinor!==null||openQuestions.length>=50)continue;
  const words=tokens(item.label).filter(w=>!['the','a','an','of','for','cost','price','unit','item','printed'].includes(w));
  const covered=openQuestions.some(q=>/\b(?:prices?|costs?|quotes?)\b|how much/i.test(q)&&(words.some(w=>tokens(q).includes(w))||/\b(?:all|missing|unknown|remaining)\b/i.test(q)));
  if(covered)continue;
  const question=`What is the unit price for ${item.label}?`;
  openQuestions.push(question);added.push(question);
 }
 return {plan:added.length?{...plan,openQuestions}:plan,added};
}

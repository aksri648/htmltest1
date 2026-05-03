// Simple deterministic generator that uses only provided text
function pickPositiveLines(proposal, context){
  // heuristics: find short positive phrases
  const lines = [];
  if (proposal.match(/increase|expand|grow|accelerat|invest/i)) lines.push('Shows growth-focused intent');
  if (context.match(/revenue|profit|growth|market/i)) lines.push('Company metrics indicate opportunity');
  if (proposal.match(/customer|user|retention/i)) lines.push('Addresses customer impact');
  if (lines.length===0) lines.push('Has clear objectives');
  while(lines.length<4) lines.push('Opportunity for further development');
  return lines.map(l=>`- ${l}`);
}

function pickDoubtLines(proposal, context){
  const lines = [];
  if (context.match(/runway|cash|loss|debt/i)) lines.push('Financial runway may be constrained');
  if (proposal.match(/rapid|aggressive|large|scale/i)) lines.push('Execution risk from pace or scale');
  if (!proposal || proposal.trim().length<20) lines.push('Proposal lacks detail');
  if (lines.length===0) lines.push('Requires clearer success metrics');
  while(lines.length<4) lines.push('Needs additional data');
  return lines.map(l=>`- ${l}`);
}

function pickContradictLines(proposal, context){
  const lines = [];
  if (proposal.match(/cost|budget|budget/i)) lines.push('Cost estimates appear optimistic');
  if (context.match(/competitive|competitor/i)) lines.push('Competitive landscape not addressed');
  if (proposal.match(/outsourc|third[- ]party/i)) lines.push('Relies on external vendors with unknown reliability');
  if (lines.length===0) lines.push('Assumptions need challenge');
  while(lines.length<4) lines.push('Potential unintended consequences');
  return lines.map(l=>`- ${l}`);
}

function makeDecision(proposal, context, bias){
  // bias: 'support','doubt','contra' influences decision
  const score = (proposal.length + context.length) % 3;
  if (bias==='support') return score>0 ? 'DECISION: YES' : 'DECISION: NO';
  if (bias==='doubt') return score>1 ? 'DECISION: YES' : 'DECISION: NO';
  return score===0 ? 'DECISION: YES' : 'DECISION: NO';
}

function generateSupportive({role, proposal, context}){
  const bullets = pickPositiveLines(proposal||'', context||'');
  const decision = makeDecision(proposal||'', context||'', 'support');
  return bullets.concat(decision).join('\n');
}

function generateDoubtful({role, proposal, context}){
  const bullets = pickDoubtLines(proposal||'', context||'');
  const decision = makeDecision(proposal||'', context||'', 'doubt');
  return bullets.concat(decision).join('\n');
}

function generateContradictive({role, proposal, context}){
  const bullets = pickContradictLines(proposal||'', context||'');
  const decision = makeDecision(proposal||'', context||'', 'contra');
  return bullets.concat(decision).join('\n');
}

function generateChairman({support, doubt, contra}){
  // summarize each string by taking first two lines of each
  const s = support.split('\n').slice(0,2).join(' ');
  const d = doubt.split('\n').slice(0,2).join(' ');
  const c = contra.split('\n').slice(0,2).join(' ');
  const summary = `## Summary\n${s} | ${d} | ${c}\n\n## Strengths\n- ${s}\n- ${d}\n\n## Risks\n- ${c}\n- ${d}\n\n## Disagreements\n- Agents differ on risk appetite\n\n## Final Decision\nPASS (Chairman balanced view based on inputs)`;
  return summary;
}

module.exports = { generateAll: function({role, proposal, context}){
  const sup = generateSupportive({role, proposal, context});
  const doubt = generateDoubtful({role, proposal, context});
  const contra = generateContradictive({role, proposal, context});
  const chairman = generateChairman({support: sup, doubt, contra});
  return { supportive: sup, doubtful: doubt, contradictive: contra, chairman };
}};

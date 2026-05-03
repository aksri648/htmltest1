const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const HF_API = process.env.HF_API_KEY;
if(!HF_API){
  console.warn('Warning: HF_API_KEY not set; HF calls will fail without it');
}

async function embedText(text, model){
  model = model || 'sentence-transformers/all-MiniLM-L6-v2';
  const url = 'https://api-inference.huggingface.co/embeddings';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HF_API}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model, input: text })
  });
  if(!resp.ok) throw new Error('Embedding request failed: '+resp.statusText);
  const j = await resp.json();
  // expect { data: [{ embedding: [...] }] }
  if(j?.data && j.data[0]?.embedding) return j.data[0].embedding;
  if(Array.isArray(j)) return j[0].embedding || j[0];
  throw new Error('Unexpected embedding response');
}

async function generateText(prompt, model){
  model = model || process.env.HF_TEXT_MODEL || 'gpt2';
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HF_API}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 250 } })
  });
  if(!resp.ok) throw new Error('Generation request failed: '+resp.statusText);
  const j = await resp.json();
  // Some models return { generated_text: '...' } or array of objects
  if(typeof j === 'string') return j;
  if(j?.generated_text) return j.generated_text;
  if(Array.isArray(j) && j[0]?.generated_text) return j[0].generated_text;
  if(Array.isArray(j) && j[0]?.generated_text === undefined && j[0]?.generated_text === null && j[0]?.error) throw new Error(j[0].error);
  // fallback: stringify
  return JSON.stringify(j);
}

module.exports = { embedText, generateText };

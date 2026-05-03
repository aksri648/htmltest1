require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const Proposal = require('./models/Proposal');
const Chunk = require('./models/Chunk');
const gen = require('./utils/generate');
const multer = require('multer');
const pdf = require('pdf-parse');
const hf = require('./utils/hfClient');

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/proposals', async (req, res) => {
  const items = await Proposal.find().sort({ createdAt: -1 });
  res.json(items);
});

app.post('/api/proposals', async (req, res) => {
  const p = new Proposal(req.body);
  await p.save();
  res.json(p);
});

app.post('/api/proposals/generate', async (req, res) => {
  const { role, proposal, context } = req.body;

  // Retrieve relevant chunks using simple embedding similarity
  let retrieved = [];
  try{
    const query = [proposal || '', context || ''].join('\n');
    const qEmb = await hf.embedText(query);
    const chunks = await Chunk.find();
    // compute cosine similarity
    const sims = chunks.map(c=>{
      const dot = c.embedding.reduce((s,v,i)=>s + v*(qEmb[i]||0), 0);
      const magA = Math.sqrt(c.embedding.reduce((s,v)=>s+v*v,0));
      const magB = Math.sqrt(qEmb.reduce((s,v)=>s+v*v,0));
      const sim = (magA && magB) ? dot/(magA*magB) : 0;
      return { chunk: c, sim };
    }).sort((a,b)=>b.sim-a.sim).slice(0,6);
    retrieved = sims.map(s=>s.chunk.text).join('\n---\n');
  }catch(err){
    console.error('RAG retrieval error', err.message);
  }

  // Use HF text-generation to create agent outputs, falling back to deterministic generator
  try{
    const promptBase = `You are an AI agent. Use ONLY the provided company text and the proposal to analyze.\n\nCOMPANY TEXT:\n${retrieved}\n\nPROPOSAL:\n${proposal}\n\nINSTRUCTIONS: Provide exactly 4 bulleted short lines, then a final line starting with 'DECISION: YES' or 'DECISION: NO'. Do not add extra commentary.`;

    const supportive = await hf.generateText(`Supportive perspective:\n${promptBase}`);
    const doubtful = await hf.generateText(`Doubtful perspective:\n${promptBase}`);
    const contradictive = await hf.generateText(`Contradictive perspective:\n${promptBase}`);

    const chairman = gen.generateChairman({ support: supportive, doubt: doubtful, contra: contradictive });
    return res.json({ supportive, doubtful, contradictive, chairman });
  }catch(err){
    console.error('HF generation failed', err.message);
    const out = gen.generateAll({ role, proposal, context });
    return res.json(out);
  }
});


// upload PDFs, extract, chunk, embed and store
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  try{
    const data = await pdf(req.file.buffer);
    const text = data.text || '';
    // simple chunking by paragraphs / 1000 chars
    const chunks = [];
    let i = 0;
    while(i < text.length){
      const chunk = text.slice(i, i+1000).trim();
      if(chunk) chunks.push(chunk);
      i += 1000;
    }
    // embed each chunk and store
    for(const c of chunks){
      const emb = await hf.embedText(c);
      const ch = new Chunk({ text: c, embedding: emb, filename: req.file.originalname });
      await ch.save();
    }
    res.json({ status: 'ok', chunks: chunks.length });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGO_URI || '';

async function start(){
  if (MONGO) {
    await mongoose.connect(MONGO);
    console.log('Connected to MongoDB');
  } else {
    console.log('No MONGO_URI provided; server will still run but DB features are disabled');
  }
  app.listen(PORT, () => console.log('Server running on port', PORT));
}

start().catch(err=>{
  console.error(err);
  process.exit(1);
});

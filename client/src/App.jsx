import React, { useState } from 'react'
import axios from 'axios'

function AgentCard({title, text}){
  return (
    <div style={{border:'1px solid #ddd', padding:12, borderRadius:6, marginBottom:8}}>
      <strong>{title}</strong>
      <pre style={{whiteSpace:'pre-wrap', marginTop:8}}>{text}</pre>
    </div>
  )
}

export default function App(){
  const [role,setRole]=useState('');
  const [proposal,setProposal]=useState('');
  const [context,setContext]=useState('');
  const [files,setFiles]=useState([]);
  const [out,setOut]=useState(null);
  const [loading,setLoading]=useState(false);

  function handleFiles(e){
    const list = Array.from(e.target.files || []);
    setFiles(list);
  }

  function parseAgentOutput(text){
    if(!text) return {bullets:[], decision:'NO'};
    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
    const bullets = lines.filter(l=>l.startsWith('- ')).map(l=>l.replace(/^-\s*/,'')).slice(0,10);
    const decLine = lines.reverse().find(l=>l.startsWith('DECISION:')) || '';
    const decision = decLine.split(':')[1] ? decLine.split(':')[1].trim() : 'NO';
    return { bullets, decision };
  }

  async function handleGenerate(e){
    e.preventDefault();
    setLoading(true);
    try{
      const r = await axios.post('/api/proposals/generate',{ role, proposal, context });
      setOut(r.data);
    }catch(err){
      alert('Error: '+(err.response?.data?.message||err.message));
    }finally{setLoading(false)}
  }

  const support = parseAgentOutput(out?.supportive);
  const doubt = parseAgentOutput(out?.doubtful);
  const contra = parseAgentOutput(out?.contradictive);
  const votes = [support.decision, doubt.decision, contra.decision];
  const yesCount = votes.filter(v=>v.toUpperCase()==='YES').length;
  const noCount = votes.filter(v=>v.toUpperCase()==='NO').length;
  const finalPassed = yesCount>noCount;

  return (
    <div style={{maxWidth:900, margin:'24px auto', fontFamily:'sans-serif'}}>
      <h1 style={{textAlign:'center'}}> AI board room </h1>

      <form onSubmit={handleGenerate} style={{display:'grid', gap:8, marginTop:12}}>
        <div>
          <strong>Upload attachments</strong>
          <div style={{marginTop:8}}>
            <input type="file" multiple onChange={handleFiles} />
            {files.length>0 && (
              <div style={{marginTop:8}}>
                {files.map((f,idx)=>(<div key={idx} style={{fontSize:13}}>- {f.name}</div>))}
              </div>
            )}
          </div>
        </div>

        <div>
          <strong>Proposal</strong>
          <textarea placeholder="Enter proposal" value={proposal} onChange={e=>setProposal(e.target.value)} rows={4} style={{width:'100%', marginTop:8}} />
        </div>

        <div>
          <strong>Company Data (optional)</strong>
          <textarea placeholder="Company data / context" value={context} onChange={e=>setContext(e.target.value)} rows={3} style={{width:'100%', marginTop:8}} />
        </div>

        <div>
          <button type="submit" disabled={loading}>{loading? 'Generating...':'Generate'}</button>
        </div>
      </form>

      {out && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16}}>
          <div style={{border:'1px solid #ddd', padding:12, borderRadius:6}}>
            <strong>Supportive Agent</strong>
            <ul>
              {support.bullets.map((b,i)=>(<li key={i}>{b}</li>))}
            </ul>
            <div><strong>Vote:</strong> {support.decision}</div>
          </div>

          <div style={{border:'1px solid #ddd', padding:12, borderRadius:6}}>
            <strong>Doubtful Agent</strong>
            <ul>
              {doubt.bullets.map((b,i)=>(<li key={i}>{b}</li>))}
            </ul>
            <div><strong>Vote:</strong> {doubt.decision}</div>
          </div>

          <div style={{border:'1px solid #ddd', padding:12, borderRadius:6}}>
            <strong>Contradictive Agent</strong>
            <ul>
              {contra.bullets.map((b,i)=>(<li key={i}>{b}</li>))}
            </ul>
            <div><strong>Vote:</strong> {contra.decision}</div>
          </div>

          <div style={{gridColumn:'1/-1', marginTop:8}}>
            <div style={{border:'1px solid #ccc', padding:12, borderRadius:6}}>
              <strong>Votes Summary</strong>
              <table style={{width:'100%', marginTop:8, borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{textAlign:'left', borderBottom:'1px solid #eee'}}>Option</th>
                    <th style={{textAlign:'right', borderBottom:'1px solid #eee'}}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Yes</td>
                    <td style={{textAlign:'right'}}>{yesCount}</td>
                  </tr>
                  <tr>
                    <td>No</td>
                    <td style={{textAlign:'right'}}>{noCount}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{marginTop:8}}><strong>Final verdict:</strong> {finalPassed ? 'PASSED' : 'NOT PASSED'}</div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

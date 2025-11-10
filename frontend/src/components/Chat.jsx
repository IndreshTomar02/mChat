import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, streamMessage } from '../api';

export default function Chat({ token, user, onLogout }){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const containerRef = useRef();
  useEffect(()=>{ containerRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  function pushMessage(role, text){ setMessages(m=>[...m, { role, text, ts: Date.now() }]); }
  async function handleSend(e){
    e?.preventDefault();
    if(!input) return;
    const msg = input; setInput(''); pushMessage('user', msg);
    setStreaming(true);
    let buffer = '';
    const es = streamMessage(token, { input: msg, model: 'gpt-4o-mini' },
      (chunk)=>{ buffer += chunk;
        setMessages(m=>{
          const copy = [...m];
          if(copy.length === 0 || copy[copy.length-1].role !== 'assistant') copy.push({ role: 'assistant', text: chunk, ts: Date.now() });
          else copy[copy.length-1].text = (copy[copy.length-1].text||'') + chunk;
          return copy;
        });
      },
      ()=>{ setStreaming(false); sendMessage(token,null,msg).catch(()=>{}); },
      (err)=>{ setStreaming(false); pushMessage('assistant','[stream error]'); console.error(err); }
    );
  }

  return (<div className='chat-root'>
    <div className='chat-header'>
      <div><strong>Nimbus</strong> — AI Chat</div>
      <div className='header-actions'>
        <div>{user?.name}</div>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
    <div className='chat-body'>
      {messages.map((m,i)=>(<div key={i} className={'msg '+m.role}><div className='msg-text'>{m.text}</div><div className='ts'>{new Date(m.ts).toLocaleTimeString()}</div></div>))}
      <div ref={containerRef} />
    </div>
    <form className='chat-input' onSubmit={handleSend}>
      <input value={input} onChange={e=>setInput(e.target.value)} placeholder={streaming ? 'Streaming...' : 'Type a message and hit Enter'} />
      <button type='submit' disabled={streaming}>Send</button>
    </form>
  </div>);
}

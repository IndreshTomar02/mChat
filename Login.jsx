import React, { useState } from 'react';
import { login, register } from '../api';
export default function Login({ onLogin }){
  const [email,setEmail]=useState('demo@local');
  const [pass,setPass]=useState('password');
  const [name,setName]=useState('Demo User');
  const [mode,setMode]=useState('login');
  const [err,setErr]=useState(null);
  async function submit(e){
    e.preventDefault();
    try{
      const res = mode==='login' ? await login(email,pass) : await register(email,pass,name);
      onLogin(res);
    }catch(err){ setErr(err.response?.data?.error || err.message); }
  }
  return (<div className='login'>
    <h2>Nimbus Chat</h2>
    <form onSubmit={submit}>
      {mode==='register' && <input placeholder='Name' value={name} onChange={e=>setName(e.target.value)} />}
      <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder='Password' value={pass} onChange={e=>setPass(e.target.value)} type='password' />
      {err && <div className='error'>{err}</div>}
      <button type='submit'>{mode==='login' ? 'Login' : 'Register'}</button>
    </form>
    <div>
      <button onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login' ? 'Create an account' : 'Have an account? Login'}</button>
    </div>
  </div>);
}

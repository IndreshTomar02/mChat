import axios from 'axios';
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api' });

export async function register(email, password, name){
  const r = await API.post('/auth/register', { email, password, name });
  return r.data;
}
export async function login(email, password){
  const r = await API.post('/auth/login', { email, password });
  return r.data;
}
export async function sendMessage(token, sessionId, input, model='gpt-4o-mini', temperature=0.2){
  const r = await API.post('/chat/message', { sessionId, input, model, temperature }, { headers: { Authorization: 'Bearer ' + token } });
  return r.data;
}
export function streamMessage(token, params, onChunk, onDone, onError) {
  const url =
    (process.env.REACT_APP_API_URL || 'http://localhost:4000/api') +
    '/chat/stream' +
    '?input=' + encodeURIComponent(params.input || '') +
    '&model=' + encodeURIComponent(params.model || '') +
    '&temperature=' + encodeURIComponent(params.temperature || '') +
    '&token=' + encodeURIComponent(token); // 👈 add token in URL

  const es = new EventSource(url);
  es.onmessage = (e) => {
    if (e.data === '[DONE]') {
      onDone();
      es.close();
      return;
    }
    onChunk(e.data);
  };
  es.onerror = (err) => {
    onError(err);
    es.close();
  };
  return es;
}


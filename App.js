import React, { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
const App = ()=>{
  const [token, setToken] = useState(localStorage.getItem('nimbus_token')||null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('nimbus_user')||'null'));
  function handleLogin(data){
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('nimbus_token', data.token);
    localStorage.setItem('nimbus_user', JSON.stringify(data.user));
  }
  function handleLogout(){
    setToken(null); setUser(null);
    localStorage.removeItem('nimbus_token'); localStorage.removeItem('nimbus_user');
  }
  return token ? <Chat token={token} user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />;
};
export default App;

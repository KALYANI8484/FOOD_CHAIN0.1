import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { SuperAdmin } from './components/SuperAdmin';
import { SubAdmin } from './components/SubAdmin';
import { Vendor } from './components/Vendor';
import { Client } from './components/Client';

type Screen = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [clientZip, setClientZip] = useState('');
  const [sessionCred, setSessionCred] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const handleLoginSuccess = (role: 'super_admin' | 'sub_admin' | 'vendor' | 'client', cred?: string) => {
    if (role === 'client' && cred) {
      setClientZip(cred);
    }
    if (cred) {
      setSessionCred(cred);
    }
    setScreen(role);
  };

  const handleClientLogin = (name: string, phone: string) => {
    setClientName(name);
    setClientPhone(phone);
    setScreen('client');
  };

  return (
    <>
      {screen === 'landing' && (
        <Landing
          onNavigate={(role) => setScreen(role)}
<<<<<<< HEAD
=======
          onClientLogin={handleClientLogin}
>>>>>>> landingUpdate
        />
      )}
      {screen === 'login' && (
        <Login onLogin={handleLoginSuccess} onBack={() => setScreen('landing')} />
      )}
      {screen === 'super_admin' && <SuperAdmin onExit={() => setScreen('landing')} />}
      {screen === 'sub_admin' && <SubAdmin onExit={() => setScreen('landing')} adminEmail={sessionCred} />}
      {screen === 'vendor' && <Vendor onExit={() => setScreen('landing')} vendorPhone={sessionCred} />}
      {screen === 'client' && (
        <Client 
          onExit={() => setScreen('landing')} 
          initialName={clientName} 
          initialPhone={clientPhone} 
        />
      )}
    </>
  );
}

export default App;

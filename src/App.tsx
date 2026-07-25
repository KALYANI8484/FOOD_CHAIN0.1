import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { SuperAdmin } from './components/SuperAdmin';
import { SubAdmin } from './components/SubAdmin';
import { Vendor } from './components/Vendor';

type Screen = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [sessionCred, setSessionCred] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const handleLoginSuccess = (
    role: 'super_admin' | 'sub_admin' | 'vendor',
    cred?: string
  ) => {
    if (cred) {
      setSessionCred(cred);
    }
    setScreen(role);
  };

  return (
    <>
      {screen === 'landing' && (
        <Landing
          onNavigate={(role) => setScreen(role)}
        />
      )}
      {screen === 'login' && (
        <Login onLogin={handleLoginSuccess} onBack={() => setScreen('landing')} />
      )}
      {screen === 'super_admin' && <SuperAdmin onExit={() => setScreen('landing')} />}
      {screen === 'sub_admin' && <SubAdmin onExit={() => setScreen('landing')} adminEmail={sessionCred} />}
      {screen === 'vendor' && <Vendor onExit={() => setScreen('landing')} vendorPhone={sessionCred} />}
    </>
  );
}

export default App;

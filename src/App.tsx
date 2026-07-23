import React, { useState, useEffect, Suspense } from 'react';
const Login = React.lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Landing = React.lazy(() => import('./components/Landing').then(m => ({ default: m.Landing })));
const SuperAdmin = React.lazy(() => import('./components/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const SubAdmin = React.lazy(() => import('./components/SubAdmin').then(m => ({ default: m.SubAdmin })));
const Vendor = React.lazy(() => import('./components/Vendor').then(m => ({ default: m.Vendor })));
const Client = React.lazy(() => import('./components/Client').then(m => ({ default: m.Client })));

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
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>}>
      {screen === 'landing' && (
        <Landing
          onNavigate={(role) => setScreen(role)}

          onClientLogin={handleClientLogin}

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
    </Suspense>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { SuperAdmin } from './components/SuperAdmin';
import { SubAdmin } from './components/SubAdmin';
import { Vendor } from './components/Vendor';
import { SESSION_TOKEN_KEY } from './lib/sessionAuth';

type Screen = 'landing' | 'login' | 'signup' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

function App() {
  const [screen, setScreenState] = useState<Screen>('landing');
  const [sessionCred, setSessionCred] = useState('');

  // Helper to change screen and update browser history
  const navigateToScreen = (newScreen: Screen, cred?: string, isPopState = false) => {
    if (cred) setSessionCred(cred);
    setScreenState(newScreen);

    if (!isPopState) {
      window.history.pushState({ appScreen: newScreen, cred: cred || sessionCred }, '', `#${newScreen}`);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Handle phone physical Back button navigation
  useEffect(() => {
    // Initial state setup
    window.history.replaceState({ appScreen: 'landing' }, '', '#landing');

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.appScreen) {
        setScreenState(e.state.appScreen);
        if (e.state.cred) setSessionCred(e.state.cred);
      } else {
        setScreenState('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (
    role: 'super_admin' | 'sub_admin' | 'vendor',
    cred?: string
  ) => {
    navigateToScreen(role, cred);
  };

  const handleExit = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    // Clear the in-memory credential too — otherwise a Back-button popstate can
    // rehydrate it from history state (see handlePopState above / pushState in
    // navigateToScreen), leaking the previous user's identifier into a fresh login.
    setSessionCred('');
    navigateToScreen('landing');
  };

  return (
    <>
      {screen === 'landing' && (
        <Landing
          onNavigate={(role) => navigateToScreen(role as any)}
        />
      )}
      {(screen === 'login' || screen === 'signup') && (
        <Login initialMode={screen === 'signup' ? 'signup' : 'login'} onLogin={handleLoginSuccess} onBack={() => navigateToScreen('landing')} />
      )}
      {screen === 'super_admin' && <SuperAdmin onExit={handleExit} />}
      {screen === 'sub_admin' && <SubAdmin onExit={handleExit} adminEmail={sessionCred} />}
      {screen === 'vendor' && <Vendor onExit={handleExit} vendorId={sessionCred} />}
    </>
  );
}

export default App;

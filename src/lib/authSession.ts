import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Wrap the dashboard route with a server-session gate.
export function useAuthenticatedSession() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
      .then((response) => {
        if (cancelled) return;
        if (!response.ok) {
          navigate('/', { replace: true });
          return;
        }
        setAuthenticated(true);
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => { cancelled = true; };
  }, [navigate]);

  return authenticated;
}

export async function logoutServerSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

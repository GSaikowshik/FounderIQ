import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for auth state changes (handles PKCE code-exchange or implicit token flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true });
      }
    });

    // 2. Fetch the session immediately (in case client has already parsed tokens on load)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
      } else if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        // If there's no session, check if there is an error in the query parameters (e.g. email link expired)
        const params = new URLSearchParams(window.location.search);
        const errorDescription = params.get('error_description') || params.get('error');
        if (errorDescription) {
          setError(errorDescription);
        } else {
          // Set a timeout to handle cases where exchange takes a moment or if page is loaded without tokens
          const timer = setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                navigate('/dashboard', { replace: true });
              } else {
                setError('Authentication failed. No active session could be established. Please try logging in again.');
              }
            });
          }, 5000);
          return () => clearTimeout(timer);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 font-sans text-white">
        <div className="max-w-md w-full text-center space-y-4 p-8 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-red-400">Authentication Error</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 font-sans text-white">
      <div className="max-w-md w-full text-center space-y-4 p-8 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-2xl flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <h2 className="text-xl font-bold mt-4">Verifying login...</h2>
        <p className="text-slate-400 text-sm">Please wait while we establish your session.</p>
      </div>
    </div>
  );
}

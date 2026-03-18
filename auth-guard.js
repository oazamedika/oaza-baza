/**
 * auth-guard.js
 * Include this script in EVERY protected page BEFORE any other scripts.
 * It checks for a valid Supabase session and redirects to index.html if missing.
 *
 * Hosted on GitHub Pages — all redirects use relative paths so they work
 * under any repo sub-path (e.g. https://user.github.io/repo-name/).
 */

(function () {
  const SUPABASE_URL  = 'https://uhbfulofeqlvyslyfvsf.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYmZ1bG9mZXFsdnlzbHlmdnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDAwOTQsImV4cCI6MjA4OTQxNjA5NH0.1WDHtXZBkbZB8pcSOQEqXE-03xM-Vc6eZe8IfyocO1Q';

  // Resolve the login page relative to the current file — works at any URL depth.
  function loginURL() {
    const a = document.createElement('a');
    a.href = 'index.html';
    return a.href;
  }

  // Load Supabase SDK only once per page.
  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase) { resolve(window.supabase); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload  = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Hide page content until auth check completes — prevents flash of protected content.
  document.documentElement.style.visibility = 'hidden';

  loadSupabase().then(({ createClient }) => {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        // Use localStorage so the session survives page navigations on GitHub Pages.
        persistSession: true,
        storageKey: 'oaza-portal-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,   // needed if Supabase ever redirects with tokens in URL
      }
    });

    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.replace(loginURL());
      } else {
        // Expose globally for use in page scripts.
        window._sb       = sb;
        window._session  = session;
        window._user     = session.user;

        // Derive human-readable username from email convention: username@oaza.internal
        const email = session.user.email || '';
        window._username = email.replace('@oaza.internal', '');

        document.documentElement.style.visibility = '';
      }
    }).catch(() => {
      window.location.replace(loginURL());
    });

  }).catch(() => {
    window.location.replace(loginURL());
  });
})();

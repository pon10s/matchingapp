/*
 * Supabase client initialization and helper functions.
 * This module sets up a global Supabase client instance and helper methods
 * for authentication state and logout. It should be loaded after the
 * supabase-js CDN script. See https://supabase.com/docs/reference/javascript/initializing
 * for details on initialization parameters and usage【39645647059278†L150-L215】.
 */

// Replace the URL and key with your own Supabase project settings
const SUPABASE_URL = 'https://wpagpmjjgwsnowvnhmml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-e8W4jFQ-TB9KraQBA_OTw_moXmZGEz';

// Create a single Supabase client for your app. When loaded via the CDN,
// the `supabase` global contains the library, so we call createClient on it【39645647059278†L150-L215】.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: ensure the user is logged in. If not, redirect to the login page.
async function ensureLoggedIn() {
  const { data } = await supabaseClient.auth.getUser();
  if (!data || !data.user) {
    window.location.href = 'login.html';
    return null;
  }
  return data.user;
}

// Helper: log out the current user and redirect to login page.
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Expose globally so that other modules can access the client and helpers
window.supabaseClient = supabaseClient;
window.ensureLoggedIn = ensureLoggedIn;
window.logout = logout;
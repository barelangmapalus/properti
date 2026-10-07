// Supabase public client configuration.
// Replace the placeholder with the Publishable/anon public key from Supabase.
window.SUPABASE_URL = 'https://jnyxcekoqunnhgmwthsz.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_PQOTZ0myLItb1kF1R2WaHQ_7HfVbQfT';

window.supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const SUPABASE_URL = "https://ocyabbrncokgtahaqqkv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeWFiYnJuY29rZ3RhaGFxcWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTQ0MTcsImV4cCI6MjA5OTA5MDQxN30.ymQ6V0FxE2dSV9KwGRJocFIUGQ9smM_rlvNe8540pwI";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

window.supabaseClient = supabaseClient;

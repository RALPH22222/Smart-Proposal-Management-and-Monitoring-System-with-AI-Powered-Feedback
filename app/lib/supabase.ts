import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 1. URL from your snippet
const supabaseUrl = "https://ilutdlvlhjpxsyvedyxf.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdXRkbHZsaGpweHN5dmVkeXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTg3ODksImV4cCI6MjA3OTI5NDc4OX0.UyMtc1mwY4OQFc7gIaFXjPGeDZ8gbGchkcLp7Lbxom8";

// 3. Create the client with AsyncStorage for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const PROPOSAL_FILES_BUCKET = "proposal_files";
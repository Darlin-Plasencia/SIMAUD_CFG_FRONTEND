import { createClient } from '@supabase/supabase-js';

const resolveEnvironment = (): Record<string, string | undefined> => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env as Record<string, string>;
    }
  } catch {
    // Accessing import.meta can throw in some Node environments; fall back to process.env
  }

  return (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
};

const env = resolveEnvironment();

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const isTestEnvironment = env.NODE_ENV === 'test' || env.MODE === 'test' || env.JEST_WORKER_ID !== undefined;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing Supabase environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

if (!isTestEnvironment) {
  console.log('[Supabase] Client initialized');
  console.log('URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'simaud-auth'
  }
});

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  cedula: string;
  role: 'admin' | 'supervisor' | 'gestor' | 'user';
  created_at: string;
  updated_at: string;
}

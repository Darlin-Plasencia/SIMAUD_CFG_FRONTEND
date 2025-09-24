import '@testing-library/jest-dom/jest-globals';

process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppzvzpnbsokxjhfqpjkw.supabase.co';
const supabaseKey = 'sb_publishable_oneWFLmMmL3btbkaRJqECA_FT73d1fP';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

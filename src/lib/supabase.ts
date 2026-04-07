import { createClient } from '@supabase/supabase-js';

// These will be populated from Fastify config via service injection 
// or read directly from process.env if needed. 
// Standard practice in this repo seems to be process.env for libs.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

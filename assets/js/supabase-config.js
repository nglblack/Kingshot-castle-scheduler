// Supabase Configuration
// This file contains your Supabase project credentials
// These are safe to expose publicly as they're protected by Row Level Security (RLS)

const SUPABASE_CONFIG = {
    url: 'https://sjhjkwuuibwxhfaulpsu.supabase.co',
    anonKey: 'sb_publishable_xpfnUSz0MiHtm5xoNwoouQ_OubKJais'
    // ⬆️ IMPORTANT: Replace the above line with your FULL publishable key
    // 
    // To get your key:
    // 1. Go to Supabase Dashboard > Settings > API Keys
    // 2. Find "Publishable key" (starts with sb_publishable_...)
    // 3. Click the COPY button
    // 4. Paste it here, wrapped in quotes like this:
    //    anonKey: 'sb_publishable_xpfnUSz0MiHtm5xoNwoouQ_...'
};

// After you add your key, the file should look like this:
// const SUPABASE_CONFIG = {
//     url: 'https://sjhjkwuuibwxhfaulpsu.supabase.co',
//     anonKey: 'sb_publishable_xpfnUSz0MiHtm5xoNwoouQ_0ubk3a_FULL_KEY_HERE'
// };


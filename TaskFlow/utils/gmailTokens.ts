import { supabase } from './supabase';

export async function saveGmailTokens(accessToken: string, refreshToken?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: profile, error: profileError } = await supabase
    .from('User')
    .select('user_id')
    .eq('supabase_uid', user.id)
    .maybeSingle();
  if (profileError || !profile) throw new Error('User profile not found in database.');

  const { error } = await supabase.from('user_gmail_tokens').upsert(
    {
      user_id: profile.user_id,
      access_token: accessToken,
      refresh_token: refreshToken,
      date_updated: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
};
import { supabase } from "./supabase";

export const syncGmailToCalendar = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('User')
      .select('user_id')
      .eq('supabase_uid', user.id)
      .maybeSingle();

    if (!profile) return;

    const { data: tokenRecord } = await supabase
      .from('user_gmail_tokens')
      .select('access_token')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (!tokenRecord?.access_token) return;

    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread',
      {
        headers: { Authorization: `Bearer ${tokenRecord.access_token}` },
      }
    );
    const data = await res.json();
    if (!data.messages) return;

    for (const msg of data.messages) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${tokenRecord.access_token}` },
        }
      );
      const detail = await detailRes.json();
      
      const headers = detail.payload?.headers || [];
      const subjectHeader = headers.find((h: any) => h.name === 'Subject');
      const subject = subjectHeader ? subjectHeader.value : 'Untitled Task from Email';

      await supabase.from('calendar_tasks').upsert({
        user_id: profile.user_id,
        title: subject,
        due_date: new Date(parseInt(detail.internalDate)).toISOString(),
        source: 'gmail',
        completed: false,
      }, { onConflict: 'user_id, title' });
    }
  } catch (error) {
    console.error('Error syncing Gmail tasks:', error);
  }
};
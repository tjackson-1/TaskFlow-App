import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { saveGmailTokens } from '../../utils/gmailTokens';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState('Finishing Gmail connection...');

  useEffect(() => {
    // On phones, openAuthSessionAsync handles the redirect; just go home.
    if (Platform.OS !== 'web') {
      router.replace('/');
      return;
    }

    (async () => {
      try {
        const hash = window.location.hash.replace(/^#/, '');
        const params = new URLSearchParams(hash || window.location.search.slice(1));

        const errorDesc = params.get('error_description');
        if (errorDesc) throw new Error(errorDesc);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (!access_token || !refresh_token) throw new Error('No tokens in redirect URL.');

        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;

        const providerToken = params.get('provider_token');
        if (!providerToken) throw new Error('Signed in, but Google returned no Gmail token.');

        await saveGmailTokens(providerToken, params.get('provider_refresh_token') ?? undefined);
        router.replace('/');
      } catch (e: any) {
        setMessage(e.message || 'Could not connect Gmail.');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12, textAlign: 'center' }}>{message}</Text>
    </View>
  );
};
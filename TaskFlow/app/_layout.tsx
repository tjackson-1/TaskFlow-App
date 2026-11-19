import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// remembers the last link, no duplicate processing
let lastHandledUrl: string | null = null;

// password-reset links ->  taskflow://reset-password#access_token=...&refresh_token=...&type=recovery
const handleRecoveryUrl = async (url: string | null) => {
  if (!url || !url.includes('reset-password') || url === lastHandledUrl) return;
  lastHandledUrl = url;

  const [beforeHash, hash = ''] = url.split('#');
  const params = new URLSearchParams(beforeHash.split('?')[1] ?? '');
  new URLSearchParams(hash).forEach((value, key) => params.set(key, value));

  const errorDesc = params.get('error_description');
  if (errorDesc) {
    Alert.alert('Reset link problem', errorDesc.replace(/\+/g, ' '));
    return;
  }

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    Alert.alert('Error', 'Invalid or expired password reset link.');
  }
};

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // listen for password-reset links (app launched by the link, or already open)
  useEffect(() => {
    Linking.getInitialURL().then(handleRecoveryUrl);
    const sub = Linking.addEventListener('url', (e) => handleRecoveryUrl(e.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthScreen =
      pathname.includes('loginPage') ||
      pathname.includes('signup') ||
      pathname.includes('forgot-password') ||
      pathname.includes('reset-password');

    if (!session && !isAuthScreen) {
      router.replace('/loginPage');
    } else if (session && pathname.includes('loginPage')) {
      router.replace('/');
    }
  }, [session, loading, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

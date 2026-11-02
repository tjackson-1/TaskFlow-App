import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { supabase } from '../utils/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
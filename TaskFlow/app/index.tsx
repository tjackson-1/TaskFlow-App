import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardCard from '../components/dashboardCard';
import CalendarCard from '../components/calendarCard';
import Board from '../components/quickdrawBoard';
import MemoPad from '../components/memoPad';
import { supabase } from '../utils/supabase';
import { saveGmailTokens } from '../utils/gmailTokens';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [isDrawingLocked, setIsDrawingLocked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);

  useEffect(() => {
    checkGmailConnection();
  }, []);

  const checkGmailConnection = async () => {
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

      setIsGmailConnected(!!tokenRecord?.access_token);
    } catch (err) {
      console.error('Error checking Gmail status:', err);
    }
  };

  // Google authentication setup
  const handleGoogleSignIn = async () => {
    try {
      setIsSyncing(true);
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'taskflow',
        path: 'auth/callback'
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase.');

      // Native: open the auth browser and read the redirect URL it returns
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return; // cancelled or dismissed

      const url = result.url;
      const params = new URLSearchParams(url.split('#')[1] ?? url.split('?')[1] ?? '');
      const code = new URLSearchParams(url.split('?')[1]?.split('#')[0] ?? '').get('code');

      let providerToken: string | null | undefined;
      let providerRefresh: string | null | undefined;

      if (code) {
        const { data: s, error: exError } = await supabase.auth.exchangeCodeForSession(code);
        if (exError) throw exError;
        providerToken = s.session?.provider_token;
        providerRefresh = s.session?.provider_refresh_token;
      } else {
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (!access_token || !refresh_token) throw new Error('No token in redirect URL.');

        const { error: setError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (setError) throw setError;
        providerToken = params.get('provider_token');
        providerRefresh = params.get('provider_refresh_token');
      }

      if (!providerToken) {
        Alert.alert('Auth notice', 'Signed in, but no Gmail token was returned. Check scopes and Google consent screen.');
        return;
      }

      await saveGmailTokens(providerToken, providerRefresh ?? undefined);
      setIsGmailConnected(true);
      Alert.alert('Success', 'Gmail connected successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to connect Gmail');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaProvider>
      <DashboardCard />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDrawingLocked}
      >
        <View style={styles.gmailSection}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Gmail Sync</Text>
            <View style={[styles.badge, isGmailConnected ? styles.badgeConnected : styles.badgeDisconnected]}>
              <Text style={[styles.badgeText, isGmailConnected ? styles.badgeTextConnected : styles.badgeTextDisconnected]}>
                {isGmailConnected ? '● Connected' : '○ Not Connected'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isGmailConnected && styles.connectedButton]}
            onPress={handleGoogleSignIn}
            disabled={isSyncing}
          >
            <Text style={styles.buttonText}>
              {isSyncing ? 'Connecting...' : isGmailConnected ? 'Reconnect / Update Gmail' : 'Connect Gmail Inbox'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CalendarCard />
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.toggleButton, isDrawingLocked && styles.toggleActive]}
            onPress={() => setIsDrawingLocked(!isDrawingLocked)}
          >
            <Text style={styles.toggleText}>
              {isDrawingLocked ? '↕' : '✐ᝰ'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Board />
        </View>

        <View style={styles.section}>
          <MemoPad />
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 4
  },
  scrollContent: {
    paddingBottom: 100
  },
  buttonSection: {
    marginTop: 0,
    marginHorizontal: 4,
    marginBottom: 0
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'grey'
  },
  toggleTextActive: {
    color: 'black'
  },
  toggleButton: {
    alignSelf: 'center',
    backgroundColor: '#d8ebff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8ebff'
  },
  toggleActive: {
    backgroundColor: '#f2f8ff'
  },
  gmailSection: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    margin: 4,
    backgroundColor: '#fafafa'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10
  },
  button: {
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeConnected: {
    backgroundColor: '#e1f5fe'
  },
  badgeDisconnected: {
    backgroundColor: '#ffebee'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  badgeTextConnected: {
    color: '#0089d3'
  },
  badgeTextDisconnected: {
    color: '#bb1c1c'
  },
  connectedButton: {
    backgroundColor: '#1dd14a'
  }
});

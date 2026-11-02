import React, { useState,useEffect } from 'react';
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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [isDrawingLocked, setIsDrawingLocked] = useState(false);

  //google authentication setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "396456010275-tkp4ek2uvenkoi2kn4h0vk0ovbb49j5s.apps.googleusercontent.com",
    scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    
  });

  useEffect(() => {
    if (response?.type === 'success'){
        const { authentication } = response;
        const accessToken = authentication?.accessToken;
        const refreshToken = authentication?.refreshToken;

        //send tokens to supabase
        saveGmailTokens(accessToken, refreshToken);
    }
  }, [response]);

  const saveGmailTokens = async (accessToken?: string, refreshToken?: string) => {
    try{
        const {data: { user }} = await supabase.auth.getUser();
        if (!user) return;

        //check user in supabase
        const {data: profile, error: profileError} = await supabase
            .from('User')
            .select('user_id')
            .eq('supabase_uid', user.id)
            .single();

        if (profileError || !profile) {
            Alert.alert("User profile not found in database.");
            return;
        }
        //save tokens into user_gmail_token
        const { error } = await supabase.from('user_gmail_tokens').upsert({
            user_id: profile?.user_id,
            access_token: accessToken,
            refresh_token: refreshToken,
            date_updated: new Date(),
        });
        if (error) throw error;
        Alert.alert("Success", "Gmail connected successfully.");
    }catch (error: any){
        Alert.alert("Error", error.message || "Failed to save Gmail token.");
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
                <Text style={styles.title}>Gmail Sync</Text>
                <TouchableOpacity style={styles.button}
                    disabled={!request}
                    onPress={() => promptAsync()}
                >
                    <Text style={styles.buttonText}>Connect Gmail Inbox</Text>
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
    borderWidth: 1
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
  }
});

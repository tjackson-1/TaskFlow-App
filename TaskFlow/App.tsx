import React, { useState, useEffect } from 'react';
import {  
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  FlatList,
  ActivityIndicator
 } from 'react-native';
import { supabase } from './utils/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginPage from './components/loginPage';
import Signup from './components/signup';
import DashboardCard from './components/dashboardCard';
import CalendarCard from './components/calendarCard';
import Board from './components/quickdrawBoard';
import MemoPad from './components/memoPad';


export default function App() {
  const [isDrawingLocked, setIsDrawingLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup'>('login');
  

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session} }) => {
      setSession(session);
      setLoading(false);
    });

    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) {
    return(
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  //is there isnt a session, go to login page
  if (!session) {
    return(
      <SafeAreaProvider>
        {currentScreen === 'login' ? (
          <LoginPage onSignupSwitch={() => setCurrentScreen('signup')} /> 
        ) : (
          <Signup onLoginSwitch={() => setCurrentScreen('login')} />
        )}
      </SafeAreaProvider>
    );
  }


  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDrawingLocked}
        >
          <DashboardCard />

          <View style={styles.section}>
            <CalendarCard />
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.toggleButton, isDrawingLocked && styles.toggleActive]}
              onPress={() => setIsDrawingLocked(!isDrawingLocked)}
            >
              <Text style={styles.toggleText}>
                {isDrawingLocked ? 'Drawing Locked (Tap to Scroll)' : '(Tap to Draw)'}
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
    backgroundColor: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  section: {
    marginVertical: 14,
    marginHorizontal: 4
  },
  scrollContent: {
    paddingBottom: 100
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
    backgroundColor: '#d8ebff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8ebff'
  },
  toggleActive: {
    backgroundColor: '#f2f8ff'
  }
});

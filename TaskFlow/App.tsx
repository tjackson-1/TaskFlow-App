import React, { useState } from 'react';
import {  ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginPage from './components/loginPage';
import DashboardCard from './components/dashboardCard';
import CalendarCard from './components/calendarCard';
import Board from './components/quickdrawBoard';
import MemoPad from './components/memoPad';


export default function App() {
  const [isDrawingLocked, setIsDrawingLocked] = useState(false);
  
  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDrawingLocked}
        >
        <LoginPage />
        

        <DashboardCard />

        <View style={styles.section}>
          <Text style={styles.subHeader}>Calendar</Text>
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

          <Board />

          <View style={styles.section}>
            <MemoPad />
          </View>

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
  header: {
    alignContent: 'center',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 40,
    color: '#000',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
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

import React from "react";
import { Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Header } from "@rneui/themed";
import { supabase } from "../utils/supabase";

export default function DashboardCard() {
  //prompts user to sign out
  const handleMenuPress = () => {
    console.log("Menu button pressed.");
    Alert.alert(
      "Menu Options",
      "What would you like to do?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Error signing out:', error.message);
              Alert.alert('Error', 'Could not sign out.');
            }
          },
        },
      ]
    );
  };
    
  const handleHomePress = () => {
    //TODO make go to top of page maybe
    console.log("Home button pressed.")
  };
  return (
    <Header
      backgroundColor="black"
      barStyle="default"
      centerComponent={{
          text: "TASKFLOW",
          style: { color: "#fff", fontWeight: "bold" }
      }}
      containerStyle={{ width: '100%' }}
      leftComponent={
        <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
          <Image
            source={require('../assets/menu.png')}
            style={styles.iconImage} 
          />
        </TouchableOpacity>
      }
      rightComponent={
        <TouchableOpacity onPress={handleHomePress} style={styles.iconButton}>
          <Image
            source={require('../assets/home.png')}
            style={styles.iconImage} 
          />
        </TouchableOpacity>
      }
      placement="center"
    />
  );
}

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  iconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#fff'
  },
});
import React, { useEffect, useState } from "react";
import {
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
  Text,
  Modal,
  Pressable,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";

type Props = {
  isGmailConnected: boolean;
  isSyncing: boolean;
  onConnectGmail: () => void;
};

export default function DashboardCard({ isGmailConnected, isSyncing, onConnectGmail }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);  
  const insets = useSafeAreaInsets();

  //loads signed in user
  const loadUser = async () => {
    const {data: {user}} = await supabase.auth.getUser();
    if(!user){
      setUserName(null);
      setUserEmail(null);
      return;
    }
    setUserEmail(user.email ?? null);

    const {data: profile} = await supabase
      .from('User')
      .select('name')
      .eq('supabase_uid', user.id)
      .maybeSingle();
    setUserName(profile?.name ?? null);
  };

  useEffect(() => {
    loadUser();

    //keep display if signed out
    const {data: {subscription}} = supabase.auth.onAuthStateChange(() => {
      setTimeout(loadUser, 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = () => {
    setMenuOpen(false);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Error signing out:", error.message);
            Alert.alert("Error", "Could not sign out.");
          }
        },
      },
    ]);
  };

  const handleConnectPress = () => {
    // close the menu first so it isn't open behind the sign-in browser
    setMenuOpen(false);
    onConnectGmail();
  };

  const handleHomePress = () => {
    //TODO make go to top of page maybe
    console.log("Home button pressed.");
  };

  return (
    <View style={[styles.header, {paddingTop: insets.top }]}>
      {/*can't see main phone icons, so added this*/}
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconButton}>
        <Image source={require("../assets/menu.png")} style={styles.iconImage} />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleHomePress} style={styles.iconButton}>
        <Image source={require("../assets/home.png")} style={styles.iconImage} />
      </TouchableOpacity>

      <Modal
        visible={menuOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        {/* tapping outside the panel closes menu */}
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menuPanel, { marginTop: insets.top + 50 }]} onPress={() => {}}>
            <View style={styles.gmailSection}>
              <View style={styles.headerRow}>
                <Text style={styles.gmailTitle}>Gmail Sync</Text>
                <View
                  style={[
                    styles.badge,
                    isGmailConnected ? styles.badgeConnected : styles.badgeDisconnected,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isGmailConnected ? styles.badgeTextConnected : styles.badgeTextDisconnected,
                    ]}
                  >
                    {isGmailConnected ? "● Connected" : "○ Not Connected"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, isGmailConnected && styles.connectedButton]}
                onPress={handleConnectPress}
                disabled={isSyncing}
              >
                <Text style={styles.buttonText}>
                  {isSyncing ? "Connecting..." : isGmailConnected ? "Reconnect / Update Gmail" : "Connect Gmail Inbox"}
                </Text>
              </TouchableOpacity>
            </View>

            {/*Signed in user */}
            {userName || userEmail ? (
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Signed in as:</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName || userEmail}
                </Text>
                {userName && userEmail ? (
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {userEmail}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: "black",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    justifyContent: "space-between",
  },
  iconButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  iconImage: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  menuPanel: {
    marginHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  userLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black'
  },
  userInfo: {
    marginTop: 10,
    paddingTop: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black'
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    marginTop: 1
  },
  signOutButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  signOutText: {
    color: "#d11a2a",
    fontSize: 14,
    fontWeight: "600",
  },
  gmailSection: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  gmailTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
  },
  button: {
    height: 52,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  connectedButton: {
    backgroundColor: "#1dd14a",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeConnected: {
    backgroundColor: "#e1f5fe",
  },
  badgeDisconnected: {
    backgroundColor: "#ffebee",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeTextConnected: {
    color: "#0089d3",
  },
  badgeTextDisconnected: {
    color: "#bb1c1c",
  },
});
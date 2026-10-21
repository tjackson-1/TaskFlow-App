import React, {useState} from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Keyboard,
    ActivityIndicator,
    Platform
} from 'react-native';
import { router } from "expo-router";
import { supabase } from "../utils/supabase";

export default function Signup({onLoginSwitch}: {onLoginSwitch: () => void}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setErrorMessage("Please fill out all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setErrorMessage("Password is not long enough.");
            return;
        }

        Keyboard.dismiss();
        setErrorMessage('');
        setLoading(true);

        try {
            //API call, database trigger
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        full_name: name.trim(),
                    },
                },
            });

            if (authError) {
                setErrorMessage(authError.message);
                setLoading(false);
                return;
            };
        } catch (error) {
            setErrorMessage("Could not create account.")
        } finally {
            setLoading(false);
        }
    };

    return(
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{flex: 1}}
                > */}
                    <View style={styles.section}>
                    <Text style={styles.title}>Create Account</Text>

                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                    <TextInput style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput style={styles.input} 
                        placeholder="Email Address"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <TextInput style={styles.input} 
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TextInput style={styles.input} 
                        placeholder="Confirm Password"
                        placeholderTextColor="#999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={onLoginSwitch}>
                            <Text style={styles.loginText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
            {/* </KeyboardAvoidingView> */}
            </ScrollView> 
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1, 
        justifyContent: 'center'
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8
    },
    section: {
        marginVertical: 14,
        marginHorizontal: 4
    },
    input: {
    height: 52,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  button: {
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff2418',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  loginText: {
    padding: 10,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  }
})
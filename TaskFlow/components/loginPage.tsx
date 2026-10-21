import { useState } from "react";
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    Touchable,
    SafeAreaView,
    ActivityIndicator, 
    Keyboard, 
    Platform,
    TouchableOpacity,
    KeyboardAvoidingView
} from 'react-native';
import { TouchableWithoutFeedback } from "react-native";
import {router} from 'expo-router';
import { supabase } from "../utils/supabase";

export default function LoginPage({onSignupSwitch}: {onSignupSwitch: () => void}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] =useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMessage('Please fill in all form fields.');
            return;
        };

        Keyboard.dismiss();
        setErrorMessage('');
        setLoading(true);

        try{
            //TODO: add auth API call
          const {error} = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });
          
          if (error){
            setErrorMessage(error.message);
            setLoading(false);
            return;
          }
          //router.replace('/calendarCard');
        } catch (error){
            setErrorMessage('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue.</Text>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <View style={styles.inputGroup}>
                    <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    />
                    <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    textContentType="password"
                    />

                    {/*need to make this work too */}
                    <TouchableOpacity
                        style={styles.forgotButtonContainer}
                        onPress={() => router.push('/forgot-password')}
                    >
                        <Text style={styles.forgotButton}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={'#fff'} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Signup / Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={onSignupSwitch}>
                            <Text style={styles.signUpText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
  safeArea:{
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 250,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: '#666'
  },
  inputGroup: {
    gap: 14
  },
  input: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#999'
  },
  forgotButtonContainer: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: 2
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 24
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
  signUpText: {
    padding: 10,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  }
});



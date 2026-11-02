import { useState } from "react";
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    SafeAreaView,
    ActivityIndicator, 
    Keyboard, 
    //Platform,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform
} from 'react-native';
import {router} from 'expo-router';
import { supabase } from "../utils/supabase";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] =useState('');

    const handleLogin = async () => {
        console.log("Sign in button tapped.");
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
          router.replace('/');
        } catch (error){
            setErrorMessage('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >

              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
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
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text style={styles.signUpText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
  safeArea:{
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 24,
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
    padding: 14
  },
  input: {
    height: 52,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA'
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



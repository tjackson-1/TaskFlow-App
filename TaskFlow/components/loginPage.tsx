import { useState } from "react";
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    Touchable,
    SafeAreaViewBase,
    ActivityIndicator, 
    Keyboard, 
    Platform,
    TouchableOpacity,
    KeyboardAvoidingView
} from 'react-native';
import { TouchableWithoutFeedback } from "react-native";
import {router} from 'expo-router';

export default function LoginPage() {
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

        } catch (error){
            setErrorMessage('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaViewBase style={styles.safeArea}>
            {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                //platform padding for ios/android
            </TouchableWithoutFeedback> */}
            <KeyboardAvoidingView>

                <View style={styles.innerContainer}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue.</Text>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}4

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

                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={() => router.push('./forgot-password')}
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
                        <TouchableOpacity onPress={() => router.push('./signup')}>
                            <Text style={styles.signUpText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaViewBase>

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
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
  },
  inputGroup: {
    gap: 14,
  },
  input: {
    height: 52,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 24,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  signUpText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});



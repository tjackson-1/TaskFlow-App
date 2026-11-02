import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }
        setLoading(true);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: 'taskflow://reset-password'
        });
        setLoading(false);

        if (error) {
            Alert.alert("Error", error.message);
        }else {
            Alert.alert("Check your email.", "A password reset link has been sent to your email address.");
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reset Password</Text>
            <TextInput
                style={styles.input}
                placeholder='Enter your email'
                placeholderTextColor={'#999'}
                value={email}
                onChangeText={setEmail}
            />
            <TouchableOpacity style={styles.button}
                onPress={handlePasswordReset}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Sending' : 'Send Reset Password Link'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                <Text style={styles.backText}>Back to Login page</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#fff' 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20 
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#ddd', 
        padding: 14, 
        borderRadius: 8, 
        marginBottom: 16 
    },
    button: { 
        backgroundColor: '#007AFF', 
        padding: 14, 
        borderRadius: 8, 
        alignItems: 'center' 
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: '600' 
    },
    backButton: { 
        marginTop: 20, 
        alignItems: 'center' 
    },
    backText: { 
        color: '#fff' 
    }
});
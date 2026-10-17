import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');

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
            <TouchableOpacity style={styles.button} onPress={() => alert('Reset link sent.')}>
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
        color: '#007AFF' 
    }
});
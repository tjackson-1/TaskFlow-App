import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';

export default function ResetPasswordScreen() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false); // true once the recovery session exists

    // _layout.tsx turns the link in the reset email into a session.
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) setReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) setReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdatePassword = async () => {
        if (!ready) {
            Alert.alert('Error', 'Open this page from the link in your reset email.');
            return;
        }
        if (!password) {
            Alert.alert('Error', 'Enter a new password.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Password updated successfully.');
            await supabase.auth.signOut(); // make users log in new password
            router.replace('/loginPage');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Set New Password</Text>
            {!ready ? <Text style={styles.hint}>Verifying reset link...</Text> : null}
            <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity
                style={[styles.button, (!ready || loading) && styles.buttonDisabled]}
                onPress={handleUpdatePassword}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
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
        fontSize: 30,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8
    },
    hint: {
        color: '#666',
        marginBottom: 12
    },
    input: {
        height: 52,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        borderWidth: 1,
        borderColor: '#999',
        marginBottom: 12
    },
    button: {
        height: 52,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../utils/supabase';

export default function ResetPasswordScreen(){
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const params = useLocalSearchParams();

    //get recovery code -> session 
    useEffect(() => {
        const handleToken = async () => {
            //supabase params
            const code = params.code as string;
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if(error) {
                    Alert.alert("Error", "Invalid or expired password reset link.");
                }
            }
        };
        handleToken();
    }, [params]);

    const handleUpdatePassword = async () => {
        //checking input
        if (!password) {
            Alert.alert("Error", "Enter a new password.");
            return;
        }

        if (password.length < 8) {
            Alert.alert("Error", "Password is not long enough.");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({password});
        setLoading(false);

        if (error) {
            Alert.alert("Error", error.message);
        }else {
            Alert.alert('Success', 'Password updated successfully.');
            router.replace('/loginPage');
        }
    };

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Set New Password</Text>
            <TextInput style={styles.input}
                placeholder='New Password'
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
                <Text style={styles.buttonText}>Update Password</Text>
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
    button: {
        height: 52,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});
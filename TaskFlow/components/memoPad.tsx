import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function MemoPad() {
  const [memo, setMemo] = useState('');
  const [savedStatus, setSavedStatus] = useState('');

  const handleClear = () => {
    setMemo('');
    setSavedStatus('Cleared');
    setTimeout(() => setSavedStatus(''), 2000);
  };

  const exportText = async () => {
    if (!memo.trim()) {
        Alert.alert('Memo is empty.', 'Write something in the memo pad before saving.');
        return;
    }
    try{
        const fileName = `memo_${Date.now()}.txt`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, memo, {
            encoding: FileSystem.EncodingType.UTF8,
        });
        
        if(await Sharing.isAvailableAsync()){
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: 'Save Memo as .txt',
                UTI: 'public.plain-text',
            });
            setSavedStatus('Export .txt');
            setTimeout(() => setSavedStatus(''), 2000);
        }else{
            Alert.alert('Sharing Unavailable', 'Sharing is not supporte');
        }
    }catch (error){
        console.error('Error saving file.', error);
        Alert.alert('Save failed.', 'Unable to export memo file.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quick Memo</Text>
        {savedStatus ? <Text style={styles.statusText}>{savedStatus}</Text> : null}
      </View>

      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Type quick notes, ideas, or event reminders."
        placeholderTextColor="#888"
        value={memo}
        onChangeText={setMemo}
        textAlignVertical="top"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear Memo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={exportText}>
            <Text style={styles.saveButtonText}>Save as .txt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginVertical: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    statusText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    textInput: {
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        color: '#000',
        minHeight: 110,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: '#f3f4f6',
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    saveButton:{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: '#226cff',
    },
    saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    }
});
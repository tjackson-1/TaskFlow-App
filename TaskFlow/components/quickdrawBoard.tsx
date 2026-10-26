import React, { useRef } from 'react';
import { Quickdraw } from '@quickdrawjs/react-native';
import {View, StyleSheet, Alert} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function Board() {

  const board = useRef(null);

  const handleLocalSave = async (dataUrl: string) => {
    try {
      const base64Data = dataUrl.split(',')[1];
      const fileName = `drawing_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Save your drawing',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Failed to save drawing:', error);
      Alert.alert('Error', 'Could not save the drawing.');
    }
  };

  return (
    
      <View style={styles.container}>
        <Quickdraw
          ref={board} 
          theme="dark"
          grid="dots"
          onSave={handleLocalSave}
          onChange={(diff) => console.log('changed', diff)}
          style={{ flex: 1 }}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    height: 400
  }
});
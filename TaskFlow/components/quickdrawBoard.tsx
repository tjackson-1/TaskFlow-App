import React from 'react';
import { useRef, useState } from 'react';
import { Quickdraw } from '@quickdrawjs/react-native';
import {View, StyleSheet} from 'react-native';


export default function Board() {
  const board = useRef(null);
  //TODO: add ability to save locally, similar to memoPad.tsx

  return (
    
      <View style={styles.container}>
        <Quickdraw
          ref={board} 
          theme="dark"
          grid="dots"
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
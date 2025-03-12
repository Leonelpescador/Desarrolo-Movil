import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen({ route }) {
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: url }} 
        startInLoadingState={true} 
        renderLoading={() => <ActivityIndicator size="large" color="#4A90E2" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

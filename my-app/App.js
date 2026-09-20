import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DadosProvider } from './src/context/DadosContext';
import { FeedbackProvider } from './src/context/FeedbackContext';
import Navegacao from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <DadosProvider>
        <FeedbackProvider>
          <StatusBar style="dark" />
          <Navegacao />
        </FeedbackProvider>
      </DadosProvider>
    </SafeAreaProvider>
  );
}

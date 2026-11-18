import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PreferenciasProvider, usePreferencias } from './src/context/PreferenciasContext';
import { DadosProvider } from './src/context/DadosContext';
import { FeedbackProvider } from './src/context/FeedbackContext';
import Navegacao from './src/navigation';

function AppConteudo() {
  const { tema } = usePreferencias();
  return (
    <>
      <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
      <Navegacao />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferenciasProvider>
        <DadosProvider>
          <FeedbackProvider>
            <AppConteudo />
          </FeedbackProvider>
        </DadosProvider>
      </PreferenciasProvider>
    </SafeAreaProvider>
  );
}

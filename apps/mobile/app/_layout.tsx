import React from 'react';
import { LogBox, Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

// NativeWind / react-native-css-interop registers ImageBackground support,
// which triggers this React Native 0.88 warning.
LogBox.ignoreLogs([
  'ImageBackground is deprecated and will be removed in a future release',
]);

// Suppress OS accessibility font scaling globally to maintain pixel-perfect UI layouts
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.allowFontScaling = false;
(Text as any).defaultProps.maxFontSizeMultiplier = 1;

if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#09090B',
          },
          headerTintColor: '#FAFAFA',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: '#09090B',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'DocChisel',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tool/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

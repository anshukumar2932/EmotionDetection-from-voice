import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import RecordScreen from './src/screens/RecordScreen';
import UploadScreen from './src/screens/UploadScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Types
import { RootStackParamList } from './src/types/navigation';

// Theme
import { COLORS } from './src/theme/colors';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: COLORS.background },
              // Smooth slide transition
              cardStyleInterpolator: ({ current, layouts }) => ({
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                  opacity: current.progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 1],
                  }),
                },
              }),
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Record" component={RecordScreen} />
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMazes } from '../contexts/MazeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import GameLogo from '../components/GameLogo';
import { StatusBar } from 'expo-status-bar';
import { Button, Text } from 'react-native-paper';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, colors, isDark } = useTheme();
  const { userProgress } = useMazes();
  const insets = useSafeAreaInsets();

  // Log theme colors for debugging
  useEffect(() => {
    console.log('HomeScreen isDark:', isDark);
    console.log('HomeScreen Colors:', JSON.stringify(colors, null, 2));
  }, [colors, isDark]);

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: theme?.colors?.background ?? '#ffffff',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20
        }
      ]}
    >
      <StatusBar style={isDark ?? false ? 'light' : 'dark'} />

      <View style={styles.mainContent}>
        <View style={styles.logoContainer}>
          <GameLogo size={150} showText={true} />
        </View>

        <View style={styles.statsContainer}>
          <Text 
             style={[
               styles.statLabel, 
               { 
                 color: colors?.onSurfaceVariant ?? '#444444',
                 fontSize: 14, 
                 textTransform: 'uppercase',
                 fontWeight: '500'
               }
             ]}
          >
             Best Score
          </Text>
          <Text 
             style={[
               styles.statNumber, 
               { 
                 color: colors?.primary ?? '#6200ee',
                 fontSize: 48, 
                 fontWeight: 'bold'
               }
             ]}
          >
            {userProgress.highestScore ?? 0} 
          </Text>
        </View>

        <View style={styles.menuContainer}>
          <Button
            mode="contained" 
            icon={({ size, color }) => (
              <MaterialIcons name="play-arrow" size={size} color={color} />
            )}
            onPress={() => navigation.navigate('Game')}
            style={styles.menuButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Play 
          </Button>

          <Button
            mode="outlined"
            icon={({ size, color }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            )}
            onPress={() => navigation.navigate('Settings')}
            style={styles.menuButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Settings
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  statLabel: {
    marginBottom: 4,
    opacity: 0.8,
  },
  statNumber: {
  },
  menuContainer: {
    width: '85%',
    alignItems: 'center',
  },
  menuButton: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 30,
  },
  buttonContent: {
    height: 48,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;

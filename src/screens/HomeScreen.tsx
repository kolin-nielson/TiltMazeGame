import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMazes } from '../contexts/MazeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import GameLogo from '../components/GameLogo';
import { StatusBar } from 'expo-status-bar';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, themeName } = useTheme();
  const { userProgress } = useMazes();
  const insets = useSafeAreaInsets();
  const isDark = themeName === 'dark' || theme.background.toLowerCase().startsWith('#0');

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16
        }
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.logoContainer}>
        <GameLogo size={150} showText={true} />
      </View>

      <View style={styles.statsContainer}>
        <View style={[
          styles.statBox, 
          { 
            backgroundColor: theme.surface,
            ...(Platform.OS === 'ios' 
              ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.18,
                  shadowRadius: 1.0,
                }
              : { elevation: 1 }
            )
          }
        ]}>
          <Text style={[styles.statLabel, { color: theme.text, opacity: 0.6 }]}>Levels Completed</Text>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {userProgress.totalCompleted}
          </Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[
            styles.menuButton, 
            styles.primaryButton,
            { 
              backgroundColor: theme.primary,
              ...(Platform.OS === 'ios' 
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3.84,
                  }
                : { elevation: 3 }
              )
            }
          ]}
          onPress={() => navigation.navigate('LevelSelect')}
        >
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <Text style={styles.menuButtonText}>Play</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuButton, 
            styles.secondaryButton,
            { 
              backgroundColor: theme.surface,
              borderColor: theme.primary,
              ...(Platform.OS === 'ios' 
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 1.0,
                  }
                : { elevation: 1 }
              )
            }
          ]}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialIcons name="settings" size={20} color={theme.primary} />
          <Text style={[styles.menuButtonText, { color: theme.primary }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text, opacity: 0.6 }]}>
          Tilt your device to navigate the ball through mazes!
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  statBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 8,
    width: '100%',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 38,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  menuContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 4,
    height: 56,
  },
  primaryButton: {
    marginBottom: 16,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
    width: '70%',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
});

export default HomeScreen;

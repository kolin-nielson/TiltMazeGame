import React from 'react';
import { Appbar, IconButton, Text } from 'react-native-paper';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeColors } from '@types';
import { gameScreenStyles } from '@styles/GameScreenStyles';
import { useAppSelector } from '@store';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface GameHeaderProps {
  score: number;
  onQuit: () => void;
  colors: ThemeColors;
}

const GameHeader: React.FC<GameHeaderProps> = ({ score, onQuit, colors }) => {
  const coins = useAppSelector(state => state.shop.coins);
  const navigation = useNavigation();

  const goToShop = () => {
    navigation.navigate('Shop' as never);
  };

  return (
    <Appbar.Header style={[styles.header, { backgroundColor: colors.surface }]}>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color: colors.primary }]}>Score: </Text>
        <Text style={[styles.scoreValue, { color: colors.onSurface }]}>{score}</Text>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity onPress={goToShop}>
          <View style={[styles.coinsDisplayContainer, { backgroundColor: colors.surfaceVariant }]}>
            <FontAwesome5 name="coins" size={18} color="#FFD700" solid />
            <Text style={[styles.coinsValue, { color: colors.primary }]}>{coins}</Text>
          </View>
        </TouchableOpacity>
        <Appbar.Action icon="logout" color={colors.primary} size={24} onPress={onQuit} />
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 16,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  rightActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  coinsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  coinsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default React.memo(GameHeader);

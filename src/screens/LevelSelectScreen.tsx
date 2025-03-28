import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMazes } from '../contexts/MazeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MazeRenderer from '../components/MazeRenderer';
import { Maze } from '../types';

type LevelSelectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LevelSelect'>;

interface LevelSelectScreenProps {
  navigation: LevelSelectScreenNavigationProp;
}

interface MazeItemProps {
  item: Maze;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.42;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;
const SCALE = ITEM_WIDTH / 300;

const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { mazes, userProgress } = useMazes();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'custom' | 'default'>('all');

  const filteredMazeData = useMemo(() => {
    const filtered = mazes.filter(maze => {
      if (filter === 'custom') return !maze.id.includes('-');
      if (filter === 'default') return maze.id.includes('-');
      return true;
    });

    return {
      easy: filtered.filter(maze => maze.difficulty === 'easy'),
      medium: filtered.filter(maze => maze.difficulty === 'medium'),
      hard: filtered.filter(maze => maze.difficulty === 'hard'),
      custom: filtered.filter(maze => !maze.id.includes('-')),
    };
  }, [mazes, filter]);

  const renderMazeItem = ({ item }: MazeItemProps) => {
    const progress = userProgress.levels[item.id];
    const isCompleted = progress && progress.completedCount > 0;
    const bestTime = progress?.bestTime;

    return (
      <TouchableOpacity
        style={[styles.mazeItem, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('Game', { mazeId: item.id })}
      >
        <View style={styles.mazePreview}>
          <MazeRenderer
            maze={item}
            ballPosition={item.startPosition}
            ballRadius={10 * SCALE}
            scale={SCALE}
            paused={true}
          />
        </View>

        <View style={styles.mazeInfo}>
          <Text style={[styles.mazeName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          {isCompleted && (
            <View style={styles.completedBadge}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              {bestTime && <Text style={styles.bestTimeText}>{(bestTime / 1000).toFixed(1)}s</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {title} ({count})
      </Text>
    </View>
  );

  const filterOptions: { value: 'all' | 'custom' | 'default'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'default', label: 'Default' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.filterContainer}>
        {filterOptions.map(option => {
          const isActive = filter === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                { borderColor: isActive ? theme.primary : theme.text },
                isActive && { backgroundColor: theme.primary },
              ]}
              onPress={() => setFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive ? { color: '#fff' } : { color: theme.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        style={styles.list}
        data={[]}
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {(filter === 'all' || filter === 'default') && (
              <>
                {filteredMazeData.easy.length > 0 && (
                  <>
                    {renderSectionHeader('Easy', filteredMazeData.easy.length)}
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={filteredMazeData.easy}
                      keyExtractor={(item: Maze) => item.id}
                      renderItem={renderMazeItem}
                      contentContainerStyle={styles.horizontalList}
                    />
                  </>
                )}

                {filteredMazeData.medium.length > 0 && (
                  <>
                    {renderSectionHeader('Medium', filteredMazeData.medium.length)}
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={filteredMazeData.medium}
                      keyExtractor={(item: Maze) => item.id}
                      renderItem={renderMazeItem}
                      contentContainerStyle={styles.horizontalList}
                    />
                  </>
                )}

                {filteredMazeData.hard.length > 0 && (
                  <>
                    {renderSectionHeader('Hard', filteredMazeData.hard.length)}
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={filteredMazeData.hard}
                      keyExtractor={(item: Maze) => item.id}
                      renderItem={renderMazeItem}
                      contentContainerStyle={styles.horizontalList}
                    />
                  </>
                )}
              </>
            )}

            {(filter === 'all' || filter === 'custom') && filteredMazeData.custom.length > 0 && (
              <>
                {renderSectionHeader('Custom', filteredMazeData.custom.length)}
                <View style={styles.customMazeGrid}>
                  {filteredMazeData.custom.map(maze => (
                    <View key={maze.id} style={styles.gridItem}>
                      {renderMazeItem({ item: maze })}
                    </View>
                  ))}
                </View>
              </>
            )}

            {filter === 'custom' && filteredMazeData.custom.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="grid-off"
                  size={50}
                  color={theme.text}
                  style={{ opacity: 0.5 }}
                />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>
                  No custom mazes yet
                </Text>
              </View>
            )}
          </>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  mazeItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mazePreview: {
    flex: 1,
    overflow: 'hidden',
  },
  mazeInfo: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mazeName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestTimeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  customMazeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
});

export default LevelSelectScreen;

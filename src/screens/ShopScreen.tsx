import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '@store';
import { RootState } from '@store';
import { Skin, purchaseTrailAndSave, equipTrailAndSave, purchaseSkinAndSave, equipSkinAndSave } from '@store/slices/shopSlice';
import { Text, Button, Card, Appbar, SegmentedButtons, Surface, useTheme } from 'react-native-paper';
import { ShopScreenNavigationProp } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, } from 'react-native-reanimated';
import { Trail } from '@store/slices/shopSlice';
type ItemType = 'skin' | 'trail';
type Item = Skin | Trail;
const ItemPreview: React.FC<{ item: Item, itemType: ItemType }> = ({ item, itemType }) => {
  const rotation = useSharedValue(0);
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(1, { duration: 4000 }), -1);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));
  const gradientId = `grad-${item.id}`;
  const patternId = `pattern-${item.id}`;
    const renderFill = () => {
      if (itemType === 'skin') {
        const skin = item as Skin;
        switch (skin.type) {
          case 'gradient':
            return `url(#${gradientId})`;
          case 'pattern':
            return `url(#${patternId})`;
          case 'solid':
          default:
              return skin.colors[0];
        }
      } else if (itemType === 'trail') {
          return `url(#${gradientId})`
      }
    };
  return (
    <Animated.View style={style}>
      <Svg width="60" height="60" viewBox="0 0 40 40">
        <Defs>
          {itemType === 'skin' && (item as Skin).type === 'gradient' && (
          (item as Skin).gradientDirection === 'radial' ? (
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              {item.colors.map((color, index) => (
                <Stop key={index} offset={`${(index / (item.colors.length - 1)) * 100}%`} stopColor={color} />
              ))}
            </RadialGradient>
          ) : (
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {item.colors.map((color, index) => (
                <Stop key={index} offset={`${(index / (item.colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
            </LinearGradient>
            ))}
          {itemType === 'trail' && (
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {item.colors.map((color, index) => (
                <Stop key={index} offset={`${(index / (item.colors.length - 1)) * 100}%`} stopColor={color} />
              ))}
            </LinearGradient>
          )}
          {itemType === 'skin' && (item as Skin).type === 'pattern' && (item as Skin).patternType === 'dots' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10">
              <Rect width="10" height="10" fill={item.colors[0]} />
              <Circle cx="5" cy="5" r="2" fill={item.colors[1]} />
            </Pattern>
          )}
          {itemType === 'skin' && (item as Skin).type === 'pattern' && (item as Skin).patternType === 'stripes' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <Rect width="10" height="10" fill={item.colors[0]} />
              <Rect width="5" height="10" fill={item.colors[1]} />
            </Pattern>
          )}
        </Defs>
        {itemType === 'skin' ? (
          <Circle cx="20" cy="20" r="16" fill={renderFill()} />
        ) : (
          <Rect x="0" y="15" width="40" height="10" fill={renderFill()} />
        )}
      </Svg>
    </Animated.View>
  );
};
type TabValue = 'skins' | 'trails';
const ShopScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<ShopScreenNavigationProp>();
  const paperTheme = useTheme();
  const [activeTab, setActiveTab] = useState<TabValue>('skins');
  const { coins, skins, purchasedSkins, equippedSkin, trails, purchasedTrails, equippedTrail } = useAppSelector(
    (state: RootState) => state.shop
  );
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);
  const windowWidth = Dimensions.get('window').width;
  const handleBuyItem = (item: Item, itemType: ItemType) => {
    if (itemType === 'skin') {
      dispatch(purchaseSkinAndSave(item.id));
    } else if (itemType === 'trail') {
      dispatch(purchaseTrailAndSave(item.id));
    }
  };
  const handleEquipItem = (item: Item, itemType: ItemType) => {
    if (itemType === 'skin') {
      dispatch(equipSkinAndSave(item.id));
    } else if (itemType === 'trail') {
      dispatch(equipTrailAndSave(item.id));
    }
  };
  const renderShopItem = (item: Item, itemType: ItemType) => {
    const isPurchased = itemType === 'skin'
      ? purchasedSkins.includes(item.id)
      : purchasedTrails.includes(item.id);
    const isEquipped = itemType === 'skin'
      ? equippedSkin === item.id
      : equippedTrail === item.id;
    return (
      <View style={[
        styles.cardContainer,
        {
          borderColor: item.colors[0],
          borderWidth: isEquipped ? 2 : 0
        }
      ]}>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: `${item.colors[0]}20`,
            }
          ]}
          elevation={3}
        >
          <Card.Content style={styles.cardContent}>
            <View style={[styles.swatchWrapper, { borderColor: item.colors[0] }]}>
              <ItemPreview itemType={itemType} item={item} />
            </View>
            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  {
                    color: itemType === 'skin' && (item as Skin).type === 'solid'
                      ? item.colors[0]
                      : colors.onSurface
                  }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
              <View style={styles.costContainer}>
                <FontAwesome5 name="coins" size={14} color="#FFD700" solid />
                <Text
                  style={[
                    styles.itemCost,
                    {
                      color: colors.onSurfaceVariant,
                      marginLeft: 4
                    }
                  ]}
                >
                  {item.cost}
                </Text>
              </View>
            </View>
            {isEquipped ? (
              <Button
                mode="contained"
                buttonColor={item.colors[0]}
                textColor="#fff"
                disabled
                style={styles.actionButton}
                compact
              >
                Equipped
              </Button>
            ) : isPurchased ? (
              <Button
                mode="contained"
                buttonColor={item.colors[0]}
                textColor="#fff"
                onPress={() => handleEquipItem(item, itemType)}
                style={styles.actionButton}
                compact
              >
                Equip
              </Button>
            ) : (
              <Button
                mode="contained"
                buttonColor={item.colors[0]}
                textColor="#fff"
                disabled={coins < item.cost}
                onPress={() => handleBuyItem(item, itemType)}
                style={styles.actionButton}
                compact
              >
                {coins >= item.cost ? 'Buy' : 'Not enough'}
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background }
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {}
      <Appbar.Header style={{ backgroundColor: colors.surface, elevation: 4 }}>
        <Appbar.Content title="Shop" />
        <View style={[styles.coinsContainer, { backgroundColor: colors.surfaceVariant }]}>
          <FontAwesome5 name="coins" size={20} color="#FFD700" solid />
          <Text style={[styles.coinsText, { color: colors.primary }]}>{coins}</Text>
        </View>
      </Appbar.Header>
      {}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab as (value: string) => void}
          buttons={[
            {
              value: 'skins',
              label: 'Skins',
              icon: 'palette',
            },
            {
              value: 'trails',
              label: 'Trails',
              icon: 'motion',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      {}
      <View style={styles.tabContent}>
        {activeTab === 'skins' && (
          <FlatList
            data={[...skins].sort((a, b) => a.cost - b.cost)}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => renderShopItem(item, 'skin')}
          />
        )}
        {activeTab === 'trails' && (
          <FlatList
            data={[...trails].sort((a, b) => a.cost - b.cost)}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => renderShopItem(item, 'trail')}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tabContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
    elevation: 2,
  },
  segmentedButtons: {
    width: '100%',
  },
  tabContent: {
    flex: 1,
    paddingTop: 8,
  },
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
  },
  card: {
    width: '100%',
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  swatchWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  itemCost: {
    fontSize: 14,
  },
  actionButton: {
    width: '100%',
    borderRadius: 8,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
export default ShopScreen;
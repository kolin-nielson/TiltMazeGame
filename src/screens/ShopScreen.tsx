import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '@store';
import { RootState } from '@store';
import { Skin, purchaseTrailAndSave, equipTrailAndSave, purchaseSkinAndSave, equipSkinAndSave } from '@store/slices/shopSlice';
import { Text, Button, Card, Appbar, SegmentedButtons, Surface, useTheme, Chip, IconButton } from 'react-native-paper';
import { ShopScreenNavigationProp } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect, Path, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, } from 'react-native-reanimated';
import { Trail } from '@store/slices/shopSlice';
import BannerAd from '@components/common/BannerAd';

type ItemType = 'skin' | 'trail';
type Item = Skin | Trail;

// Clean rarity styling with vibrant colors
const RARITY_COLORS = {
  common: '#64748B',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
  mythic: '#EC4899'
};

const ItemPreview: React.FC<{ item: Item, itemType: ItemType }> = ({ item, itemType }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(1, { duration: 8000 }), -1);
    scale.value = withRepeat(withTiming(1.05, { duration: 2000 }), -1, true);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value * 360}deg` },
      { scale: scale.value }
    ],
  }));
  
  const gradientId = `grad-${item.id}`;
  const patternId = `pattern-${item.id}`;

  const renderFill = () => {
    if (itemType === 'skin') {
      const skin = item as Skin;
      switch (skin.type) {
        case 'gradient':
        case 'special':
        case 'legendary':
          return `url(#${gradientId})`;
        case 'pattern':
          return `url(#${patternId})`;
        case 'solid':
        default:
          return skin.colors[0];
      }
    } else {
      return `url(#${gradientId})`
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Svg width="70" height="70" viewBox="0 0 50 50">
        <Defs>
          {itemType === 'skin' && ['gradient', 'special', 'legendary'].includes((item as Skin).type) && (
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
          {itemType === 'skin' && (item as Skin).type === 'pattern' && (
            <>
              {(item as Skin).patternType === 'dots' && (
                <Pattern id={patternId} patternUnits="userSpaceOnUse" width="12" height="12">
                  <Rect width="12" height="12" fill={item.colors[0]} />
                  <Circle cx="6" cy="6" r="3" fill={item.colors[1]} />
                </Pattern>
              )}
              {(item as Skin).patternType === 'stripes' && (
                <Pattern id={patternId} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                  <Rect width="12" height="12" fill={item.colors[0]} />
                  <Rect width="6" height="12" fill={item.colors[1]} />
                </Pattern>
              )}
              {(item as Skin).patternType === 'scales' && (
                <Pattern id={patternId} patternUnits="userSpaceOnUse" width="15" height="15">
                  <Rect width="15" height="15" fill={item.colors[0]} />
                  <Circle cx="7.5" cy="4" r="4" fill={item.colors[1]} opacity="0.8" />
                  <Circle cx="0" cy="11" r="4" fill={item.colors[1]} opacity="0.8" />
                  <Circle cx="15" cy="11" r="4" fill={item.colors[1]} opacity="0.8" />
                </Pattern>
              )}
              {(item as Skin).patternType === 'hearts' && (
                <Pattern id={patternId} patternUnits="userSpaceOnUse" width="14" height="14">
                  <Rect width="14" height="14" fill={item.colors[0]} />
                  {/* Heart shape using Path */}
                  <G transform="translate(7,4)">
                    <Path 
                      d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                      fill={item.colors[1]} 
                      opacity="0.9"
                      transform="scale(0.6)"
                    />
                  </G>
                  <G transform="translate(2,10)">
                    <Path 
                      d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                      fill={item.colors[2]} 
                      opacity="0.7"
                      transform="scale(0.4)"
                    />
                  </G>
                  <G transform="translate(12,8)">
                    <Path 
                      d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                      fill={item.colors[1]} 
                      opacity="0.8"
                      transform="scale(0.5)"
                    />
                  </G>
                </Pattern>
              )}
            </>
          )}
        </Defs>
        {itemType === 'skin' ? (
          <Circle cx="25" cy="25" r="18" fill={renderFill()} stroke="#FFFFFF" strokeWidth="2" />
        ) : (
          <Rect x="5" y="20" width="40" height="10" rx="5" fill={renderFill()} />
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

  const { 
    coins, 
    skins, 
    purchasedSkins, 
    equippedSkin, 
    trails, 
    purchasedTrails, 
    equippedTrail,
    playerLevel,
    playerScore,
    achievements 
  } = useAppSelector((state: RootState) => state.shop);
  
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);

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

    const skin = itemType === 'skin' ? item as Skin : null;
    const rarity = skin?.rarity || 'common';
    const rarityColor = RARITY_COLORS[rarity];

    return (
      <Card
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.surface,
            borderColor: isEquipped ? rarityColor : colors.outline,
            borderWidth: isEquipped ? 2 : 1,
          }
        ]}
        elevation={isEquipped ? 6 : 3}
      >
        <Card.Content style={styles.cardContent}>

          {/* Item preview */}
          <View style={[styles.previewContainer, { 
            backgroundColor: colors.surfaceVariant,
            borderColor: rarityColor,
          }]}>
            <ItemPreview itemType={itemType} item={item} />
          </View>

          {/* Item details */}
          <View style={styles.itemDetails}>
            <Text
              style={[
                styles.itemName,
                { color: colors.onSurface }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>

            {/* Description */}
            {(skin?.description || (itemType === 'trail' && (item as Trail).description)) && (
              <Text
                style={[styles.itemDescription, { color: colors.onSurfaceVariant }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {skin?.description || (item as Trail).description}
              </Text>
            )}

            {/* Cost */}
            <View style={styles.costContainer}>
              <MaterialCommunityIcons name="currency-usd" size={18} color="#F59E0B" />
              <Text
                style={[
                  styles.itemCost,
                  { color: colors.primary }
                ]}
              >
                {item.cost.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Action button */}
          {isEquipped ? (
            <Button
              mode="contained"
              buttonColor={rarityColor}
              textColor="#FFFFFF"
              disabled
              style={styles.actionButton}
              icon="check-circle"
              compact
            >
              Equipped
            </Button>
          ) : isPurchased ? (
            <Button
              mode="contained"
              buttonColor={rarityColor}
              textColor="#FFFFFF"
              onPress={() => handleEquipItem(item, itemType)}
              style={styles.actionButton}
              icon="download"
              compact
            >
              Equip
            </Button>
          ) : (
            <Button
              mode="contained"
              buttonColor={coins >= item.cost ? rarityColor : colors.surfaceVariant}
              textColor={coins >= item.cost ? "#FFFFFF" : colors.onSurfaceVariant}
              disabled={coins < item.cost}
              onPress={() => handleBuyItem(item, itemType)}
              style={styles.actionButton}
              icon={coins >= item.cost ? "cart" : "currency-usd"}
              compact
            >
              {coins >= item.cost ? 'Buy' : 'Need more'}
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Sort skins by rarity and cost
  const sortedSkins = [...skins].sort((a, b) => {
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
    const aRarity = rarityOrder[a.rarity || 'common'];
    const bRarity = rarityOrder[b.rarity || 'common'];
    
    if (aRarity !== bRarity) {
      return aRarity - bRarity;
    }
    return a.cost - b.cost;
  });

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background }
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BannerAd />
      
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: colors.surface, elevation: 4 }}>
        <Appbar.Content 
          title="Shop" 
          titleStyle={[styles.headerTitle, { color: colors.onSurface }]}
        />
        <View style={[styles.coinsContainer, { backgroundColor: colors.primaryContainer }]}>
          <MaterialCommunityIcons name="currency-usd" size={20} color="#F59E0B" />
          <Text style={[styles.coinsText, { color: colors.onPrimaryContainer }]}>
            {coins.toLocaleString()}
          </Text>
        </View>
      </Appbar.Header>

      {/* Tab selector */}
      <Surface style={[styles.tabContainer, { backgroundColor: colors.surface }]} elevation={1}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab as (value: string) => void}
          buttons={[
            {
              value: 'skins',
              label: 'Ball Skins',
              icon: 'palette',
            },
            {
              value: 'trails',
              label: 'Ball Trails',
              icon: 'motion',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </Surface>
      
      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'skins' && (
          <FlatList
            data={sortedSkins}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },

  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentedButtons: {
    width: '100%',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  listContainer: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    borderRadius: 16,
    marginBottom: 16,
  },
  cardContent: {
    padding: 12,
    alignItems: 'center',
  },
  previewContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  itemDetails: {
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
  itemDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 14,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemCost: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  actionButton: {
    width: '100%',
    borderRadius: 8,
  },
});

export default ShopScreen;
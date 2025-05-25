import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GAME } from '@config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';

export type GradientAnimationType = 'cycle' | 'pulse' | 'flow' | 'spin' | 'shimmer' | 'wave';

export interface Skin {
  id: string;
  name: string;
  cost: number;
  type: 'solid' | 'gradient' | 'pattern' | 'special' | 'legendary';
  colors: string[];
  gradientDirection?: 'linear' | 'radial';
  patternType?: 'stripes' | 'dots' | 'chevron' | 'hexagon' | 'scales' | 'marble' | 'hearts';
  animated?: boolean;
  gradientAnimationType?: GradientAnimationType;
  gradientSpeed?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  description?: string;
  special?: boolean;
}

export interface Trail {
  id: string;
  name: string;
  cost: number;
  type: 'trail';
  colors: string[];
  description?: string;
}

export interface ShopState {
  coins: number;
  skins: Skin[];
  purchasedSkins: string[];
  equippedSkin: string;
  trails: Trail[];
  purchasedTrails: string[];
  equippedTrail: string;
  playerLevel: number;
  playerScore: number;
  achievements: string[];
}

const initialSkins: Skin[] = [
  // Free/Basic Tier
  { 
    id: 'default', 
    name: 'Classic Red', 
    cost: 0, 
    type: 'solid', 
    colors: ['#EF4444'], 
    rarity: 'common',
    description: 'The classic maze ball - reliable and timeless.'
  },
  
  // Common Skins (25-75 coins) - Much more affordable!
  { 
    id: 'ocean-blue', 
    name: 'Ocean Blue', 
    cost: 25, 
    type: 'solid', 
    colors: ['#0EA5E9'], 
    rarity: 'common',
    description: 'Deep as the ocean depths.'
  },
  { 
    id: 'forest-green', 
    name: 'Forest Green', 
    cost: 30, 
    type: 'solid', 
    colors: ['#10B981'], 
    rarity: 'common',
    description: 'Fresh as morning forest air.'
  },
  { 
    id: 'royal-purple', 
    name: 'Royal Purple', 
    cost: 35, 
    type: 'solid', 
    colors: ['#8B5CF6'], 
    rarity: 'common',
    description: 'Fit for digital royalty.'
  },
  { 
    id: 'sunset-orange', 
    name: 'Sunset Orange', 
    cost: 40, 
    type: 'solid', 
    colors: ['#FB923C'], 
    rarity: 'common',
    description: 'Warm as a summer sunset.'
  },
  { 
    id: 'bubblegum-pink', 
    name: 'Bubblegum Pink', 
    cost: 45, 
    type: 'solid', 
    colors: ['#F472B6'], 
    rarity: 'common',
    description: 'Sweet and playful.'
  },
  { 
    id: 'cyber-yellow', 
    name: 'Cyber Yellow', 
    cost: 50, 
    type: 'solid', 
    colors: ['#FACC15'], 
    rarity: 'common',
    description: 'Electric energy incarnate.'
  },
  { 
    id: 'midnight-black', 
    name: 'Midnight Black', 
    cost: 60, 
    type: 'solid', 
    colors: ['#1F2937'], 
    rarity: 'common',
    description: 'Dark as the void itself.'
  },
  { 
    id: 'snow-white', 
    name: 'Snow White', 
    cost: 75, 
    type: 'solid', 
    colors: ['#F8FAFC'], 
    rarity: 'common',
    description: 'Pure as fresh snow.'
  },

  // Rare Gradients (100-300 coins) - Beautiful and achievable
  { 
    id: 'fire-storm', 
    name: 'Fire Storm', 
    cost: 100, 
    type: 'gradient', 
    colors: ['#FF4500', '#FF6B35', '#FF8E3C'], 
    gradientDirection: 'linear',
    rarity: 'rare',
    description: 'Blazing hot with fiery intensity.'
  },
  { 
    id: 'ocean-wave', 
    name: 'Ocean Wave', 
    cost: 120, 
    type: 'gradient', 
    colors: ['#0891B2', '#06B6D4', '#22D3EE'], 
    gradientDirection: 'linear',
    rarity: 'rare',
    description: 'Ride the waves of the digital ocean.'
  },
  { 
    id: 'aurora-dream', 
    name: 'Aurora Dream', 
    cost: 150, 
    type: 'gradient', 
    colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'], 
    gradientDirection: 'radial',
    rarity: 'rare',
    description: 'Dancing lights of the aurora borealis.'
  },
  { 
    id: 'golden-hour', 
    name: 'Golden Hour', 
    cost: 180, 
    type: 'gradient', 
    colors: ['#F59E0B', '#FBBF24', '#FDE047'], 
    gradientDirection: 'linear',
    rarity: 'rare',
    description: 'Captured beauty of sunset\'s magic hour.'
  },
  { 
    id: 'emerald-valley', 
    name: 'Emerald Valley', 
    cost: 200, 
    type: 'gradient', 
    colors: ['#059669', '#10B981', '#34D399'], 
    gradientDirection: 'radial',
    rarity: 'rare',
    description: 'Lush greens of an untouched valley.'
  },
  { 
    id: 'cherry-blossom', 
    name: 'Cherry Blossom', 
    cost: 220, 
    type: 'gradient', 
    colors: ['#EC4899', '#F472B6', '#FBCFE8'], 
    gradientDirection: 'linear',
    rarity: 'rare',
    description: 'Delicate beauty of spring blossoms.'
  },
  { 
    id: 'livie-pink', 
    name: 'Livie Pink', 
    cost: 275, 
    type: 'pattern', 
    colors: ['#FFE4E1', '#FF69B4', '#FFC0CB'], 
    patternType: 'hearts',
    animated: true,
    gradientAnimationType: 'pulse',
    gradientSpeed: 1.2,
    rarity: 'rare',
    description: '💖 A magical pink with floating animated hearts - absolutely unique and amazing!'
  },
  { 
    id: 'neon-nights', 
    name: 'Neon Nights', 
    cost: 250, 
    type: 'gradient', 
    colors: ['#7C3AED', '#A855F7', '#C084FC'], 
    gradientDirection: 'linear',
    animated: true,
    gradientAnimationType: 'cycle',
    gradientSpeed: 1.0,
    rarity: 'rare',
    description: 'Pulsing with electric nightlife energy.'
  },
  { 
    id: 'frost-bite', 
    name: 'Frost Bite', 
    cost: 300, 
    type: 'gradient', 
    colors: ['#0EA5E9', '#38BDF8', '#E0F2FE'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'pulse',
    gradientSpeed: 0.8,
    rarity: 'rare',
    description: 'Crystalline cold with icy sparkles.'
  },

  // Epic Skins (400-800 coins) - Special effects and patterns
  { 
    id: 'dragon-scales', 
    name: 'Dragon Scales', 
    cost: 400, 
    type: 'pattern', 
    colors: ['#DC2626', '#F59E0B', '#FF6B35'], 
    patternType: 'scales',
    rarity: 'epic',
    description: 'Forged from the scales of an ancient fire dragon.'
  },
  { 
    id: 'cosmic-void', 
    name: 'Cosmic Void', 
    cost: 500, 
    type: 'gradient', 
    colors: ['#1E1B4B', '#3730A3', '#6366F1', '#8B5CF6'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'pulse',
    gradientSpeed: 0.6,
    rarity: 'epic',
    description: 'Harness the infinite power of deep space.'
  },
  { 
    id: 'rainbow-prism', 
    name: 'Rainbow Prism', 
    cost: 600, 
    type: 'gradient', 
    colors: ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'], 
    gradientDirection: 'linear',
    animated: true,
    gradientAnimationType: 'cycle',
    gradientSpeed: 1.2,
    rarity: 'epic',
    description: 'All colors of light dancing in harmony.'
  },
  { 
    id: 'molten-core', 
    name: 'Molten Core', 
    cost: 700, 
    type: 'gradient', 
    colors: ['#7F1D1D', '#DC2626', '#F97316', '#FACC15'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'shimmer',
    gradientSpeed: 1.5,
    rarity: 'epic',
    description: 'Burning with the heat of a planet\'s core.'
  },
  { 
    id: 'ethereal-mist', 
    name: 'Ethereal Mist', 
    cost: 800, 
    type: 'gradient', 
    colors: ['#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8'], 
    gradientDirection: 'linear',
    animated: true,
    gradientAnimationType: 'wave',
    gradientSpeed: 0.5,
    rarity: 'epic',
    description: 'Ghostly mist from another dimension.'
  },

  // Legendary Skins (1000-2000 coins) - Ultimate prestige
  { 
    id: 'phoenix-reborn', 
    name: 'Phoenix Reborn', 
    cost: 1000, 
    type: 'special', 
    colors: ['#FFFFFF', '#FACC15', '#F97316', '#DC2626'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'shimmer',
    gradientSpeed: 2.0,
    rarity: 'legendary',
    description: 'Rise from the ashes with blazing magnificence.',
    special: true
  },
  { 
    id: 'galaxy-core', 
    name: 'Galaxy Core', 
    cost: 1200, 
    type: 'special', 
    colors: ['#0F172A', '#1E293B', '#475569', '#E2E8F0', '#FFFFFF'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'spin',
    gradientSpeed: 0.7,
    rarity: 'legendary',
    description: 'Contains the swirling essence of a galactic center.',
    special: true
  },
  { 
    id: 'time-fracture', 
    name: 'Time Fracture', 
    cost: 1500, 
    type: 'special', 
    colors: ['#EC4899', '#06B6D4', '#FACC15', '#8B5CF6'], 
    gradientDirection: 'linear',
    animated: true,
    gradientAnimationType: 'cycle',
    gradientSpeed: 2.5,
    rarity: 'legendary',
    description: 'Bend space and time with reality-warping power.',
    special: true
  },

  // Mythic Skins (2500-5000 coins) - Ultimate achievement
  { 
    id: 'eternal-flame', 
    name: 'Eternal Flame', 
    cost: 2500, 
    type: 'legendary', 
    colors: ['#FFFFFF', '#FACC15', '#F97316', '#DC2626', '#7C2D12', '#451A03'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'shimmer',
    gradientSpeed: 1.8,
    rarity: 'mythic',
    description: 'The undying flame that burns at the heart of all creation.',
    special: true
  },
  { 
    id: 'void-walker', 
    name: 'Void Walker', 
    cost: 3000, 
    type: 'legendary', 
    colors: ['#000000', '#1F2937', '#374151', '#6B7280', '#D1D5DB', '#FFFFFF'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'pulse',
    gradientSpeed: 1.0,
    rarity: 'mythic',
    description: 'Master of shadows, walker between dimensions.',
    special: true
  },
  { 
    id: 'rainbow-infinity', 
    name: 'Rainbow Infinity', 
    cost: 4000, 
    type: 'legendary', 
    colors: ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'], 
    gradientDirection: 'linear',
    animated: true,
    gradientAnimationType: 'cycle',
    gradientSpeed: 1.5,
    rarity: 'mythic',
    description: 'All colors of existence flowing in perfect harmony.',
    special: true
  },

  // Secret/Ultimate Skin
  { 
    id: 'developers-choice', 
    name: "Developer's Secret", 
    cost: 5000, 
    type: 'legendary', 
    colors: ['#F472B6', '#22C55E', '#EC4899', '#06B6D4', '#FACC15'], 
    gradientDirection: 'radial',
    animated: true,
    gradientAnimationType: 'spin',
    gradientSpeed: 2.5,
    rarity: 'mythic',
    description: 'A hidden treasure from the game creators themselves.',
    special: true
  },
];

const initialTrails: Trail[] = [
  // Basic Trails (50-150 coins)
  { 
    id: 'shadow-fade', 
    name: 'Shadow Fade', 
    cost: 50, 
    type: 'trail', 
    colors: ['#374151', '#6B7280', '#9CA3AF']
  },
  { 
    id: 'ruby-trail', 
    name: 'Ruby Trail', 
    cost: 75, 
    type: 'trail', 
    colors: ['#DC2626', '#EF4444', '#F87171']
  },
  { 
    id: 'sapphire-stream', 
    name: 'Sapphire Stream', 
    cost: 100, 
    type: 'trail', 
    colors: ['#1D4ED8', '#3B82F6', '#60A5FA']
  },
  { 
    id: 'emerald-path', 
    name: 'Emerald Path', 
    cost: 125, 
    type: 'trail', 
    colors: ['#059669', '#10B981', '#34D399']
  },
  { 
    id: 'golden-wake', 
    name: 'Golden Wake', 
    cost: 150, 
    type: 'trail', 
    colors: ['#D97706', '#F59E0B', '#FBBF24']
  },

  // Premium Trails (200-400 coins)
  { 
    id: 'magma-flow', 
    name: 'Magma Flow', 
    cost: 200, 
    type: 'trail', 
    colors: ['#7F1D1D', '#DC2626', '#F97316', '#FACC15']
  },
  { 
    id: 'neon-stream', 
    name: 'Neon Stream', 
    cost: 250, 
    type: 'trail', 
    colors: ['#7C3AED', '#A855F7', '#C084FC']
  },
  { 
    id: 'comet-tail', 
    name: 'Comet Tail', 
    cost: 300, 
    type: 'trail', 
    colors: ['#F8FAFC', '#E2E8F0', '#FACC15', '#F97316']
  },
  { 
    id: 'livvie-love', 
    name: 'Livvie Love', 
    cost: 275, 
    type: 'trail', 
    colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFFFFF'],
    description: '💖 Hearts floating in the air - spreading love and magic wherever you go! Perfectly matches Livie Pink!'
  },
  { 
    id: 'aurora-borealis', 
    name: 'Aurora Borealis', 
    cost: 350, 
    type: 'trail', 
    colors: ['#059669', '#06B6D4', '#8B5CF6', '#EC4899']
  },
  { 
    id: 'rainbow-burst', 
    name: 'Rainbow Burst', 
    cost: 400, 
    type: 'trail', 
    colors: ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6'],
    description: '🌈 A spectacular burst of all colors following your every move!'
  },

  // Elite Trails (500-800 coins)
  { 
    id: 'cosmic-dust', 
    name: 'Cosmic Dust', 
    cost: 500, 
    type: 'trail', 
    colors: ['#1E1B4B', '#3730A3', '#6366F1', '#A855F7']
  },
  { 
    id: 'phoenix-flame', 
    name: 'Phoenix Flame', 
    cost: 600, 
    type: 'trail', 
    colors: ['#FFFFFF', '#FACC15', '#F97316', '#DC2626'],
    description: '🔥 Rising from the ashes with magnificent fiery wings!'
  },
  { 
    id: 'diamond-dust', 
    name: 'Diamond Dust', 
    cost: 700, 
    type: 'trail', 
    colors: ['#F8FAFC', '#E2E8F0', '#06B6D4', '#0EA5E9']
  },
  { 
    id: 'void-rift', 
    name: 'Void Rift', 
    cost: 750, 
    type: 'trail', 
    colors: ['#000000', '#1F2937', '#374151', '#6B7280']
  },
  { 
    id: 'prismatic-wake', 
    name: 'Prismatic Wake', 
    cost: 800, 
    type: 'trail', 
    colors: ['#EF4444', '#3B82F6', '#FACC15', '#22C55E', '#8B5CF6', '#F97316']
  }
];

const initialState: ShopState = {
  coins: 0,
  skins: initialSkins,
  purchasedSkins: ['default'],
  equippedSkin: 'default',
  trails: initialTrails,
  purchasedTrails: [],
  equippedTrail: '',
  playerLevel: 1,
  playerScore: 0,
  achievements: [],
};

export const resetShopData = createAsyncThunk(
  'shop/resetShopData',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('shopData');
    } catch (error) {
      return rejectWithValue('Failed to reset shop data');
    }
  }
);

export const loadShopData = createAsyncThunk(
  'shop/loadShopData',
  async (_, { rejectWithValue }) => {
    try {
      const shopDataJson = await AsyncStorage.getItem('shopData');
      if (shopDataJson) {
        return JSON.parse(shopDataJson);
      }
      return { coins: 0, purchasedSkins: ['default'], equippedSkin: 'default', purchasedTrails: [], equippedTrail: '' };
    } catch (error) {
      return rejectWithValue('Failed to load shop data');
    }
  }
);

export const saveShopData = createAsyncThunk(
  'shop/saveShopData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { shop: ShopState };
      const { coins, purchasedSkins, equippedSkin, purchasedTrails, equippedTrail } = state.shop;
      await AsyncStorage.setItem('shopData',JSON.stringify({ coins, purchasedSkins, equippedSkin, purchasedTrails, equippedTrail}));
      return { coins, purchasedSkins, equippedSkin };
    } catch (error) {
      return rejectWithValue('Failed to save shop data');
    }
  }
);

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    collectCoin: state => {
      state.coins += GAME.POINTS_PER_COIN;
    },
    purchaseSkin: (state, action: PayloadAction<string>) => {
      const skinId = action.payload;
      if (state.purchasedSkins.includes(skinId)) return;
      const skin = state.skins.find(s => s.id === skinId);
      if (skin && state.coins >= skin.cost) {
        state.coins -= skin.cost;
        state.purchasedSkins.push(skinId);
      }
    },
    equipSkin: (state, action: PayloadAction<string>) => {
      const skinId = action.payload;
      if (state.purchasedSkins.includes(skinId)) {
        state.equippedSkin = skinId;
      }
    },
    purchaseTrail: (state, action: PayloadAction<string>) => {
      const trailId = action.payload;
      if (state.purchasedTrails.includes(trailId)) return;
      const trail = state.trails.find(t => t.id === trailId);
      if (trail && state.coins >= trail.cost) {
        state.coins -= trail.cost;
        state.purchasedTrails.push(trailId);
      }
    },
    equipTrail: (state, action: PayloadAction<string>) => {
      const trailId = action.payload;
      if (state.purchasedTrails.includes(trailId)) {
        state.equippedTrail = trailId;
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loadShopData.fulfilled, (state, action) => {
        if (action.payload) {
          state.coins = action.payload.coins || 0;
          state.purchasedSkins = action.payload.purchasedSkins || ['default'];
          state.equippedSkin = action.payload.equippedSkin || 'default';
          state.purchasedTrails = action.payload.purchasedTrails || [];
          state.equippedTrail = action.payload.equippedTrail || '';
        }
      })
      .addCase(saveShopData.fulfilled, () => {
      })
      .addCase(resetShopData.fulfilled, state => {
        state.coins = initialState.coins;
        state.purchasedSkins = initialState.purchasedSkins;
        state.equippedSkin = initialState.equippedSkin;
        state.purchasedTrails = initialState.purchasedTrails;
        state.equippedTrail = initialState.equippedTrail;
      });
  },
});

export const { collectCoin, purchaseSkin, equipSkin, purchaseTrail, equipTrail } = shopSlice.actions;

export const collectCoinAndSave = () => (dispatch: any) => {
  dispatch(collectCoin());
  setTimeout(() => {
    dispatch(saveShopData());
  }, 0);
};

export const purchaseSkinAndSave = (skinId: string) => (dispatch: any) => {
  dispatch(purchaseSkin(skinId));
  dispatch(saveShopData());
};

export const equipSkinAndSave = (skinId: string) => (dispatch: any) => {
  dispatch(equipSkin(skinId));
  dispatch(saveShopData());
};

export const purchaseTrailAndSave = (trailId: string) => (dispatch: any) => {
  dispatch(purchaseTrail(trailId));
  dispatch(saveShopData());
};

export const equipTrailAndSave = (trailId: string) => (dispatch: any) => {
  dispatch(equipTrail(trailId));
  dispatch(saveShopData());
};

export default shopSlice.reducer;
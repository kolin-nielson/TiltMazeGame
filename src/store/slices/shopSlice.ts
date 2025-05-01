import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GAME } from '@config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';

export type GradientAnimationType = 'cycle' | 'pulse' | 'flow';



export interface Trail {
  id: string;
  name: string;
  cost: number;
  type: 'trail';
  colors: string[];
}
export interface Skin {
  id: string;
  name: string;
  cost: number;
  type: 'solid' | 'gradient' | 'pattern';
  colors: string[];
  gradientDirection?: 'linear' | 'radial';
  patternType?: 'stripes' | 'dots';
  animated?: boolean;
  gradientAnimationType?: GradientAnimationType;
  gradientSpeed?: number;
}

export interface ShopState {
  coins: number;
  skins: Skin[];
  purchasedSkins: string[];
  equippedSkin: string;
  trails: Trail[];
  purchasedTrails: string[];
  equippedTrail: string;
}

const initialSkins: Skin[] = [
  // Default skin - Simple Red
  { id: 'default', name: 'Classic Red', cost: 0, type: 'solid', colors: ['#E53935'] },

  // TIER 1: Basic Skins (100-300 coins)
  { id: 'blue-steel', name: 'Blue Steel', cost: 100, type: 'solid', colors: ['#1976D2'] },
  { id: 'emerald', name: 'Emerald', cost: 100, type: 'solid', colors: ['#2E7D32'] },
  { id: 'royal-purple', name: 'Royal Purple', cost: 100, type: 'solid', colors: ['#7B1FA2'] },
  { id: 'sunset-orange', name: 'Sunset Orange', cost: 150, type: 'solid', colors: ['#F57C00'] },
  { id: 'bubblegum', name: 'Bubblegum', cost: 150, type: 'solid', colors: ['#EC407A'] },
  { id: 'lemon-drop', name: 'Lemon Drop', cost: 150, type: 'solid', colors: ['#FDD835'] },
  { id: 'mint', name: 'Mint', cost: 200, type: 'solid', colors: ['#26A69A'] },
  { id: 'lavender', name: 'Lavender', cost: 200, type: 'solid', colors: ['#9575CD'] },
  { id: 'charcoal', name: 'Charcoal', cost: 250, type: 'solid', colors: ['#37474F'] },
  { id: 'rose-gold', name: 'Rose Gold', cost: 300, type: 'solid', colors: ['#D1A3A4'] },

  // TIER 2: Gradient Skins (350-700 coins)
  { id: 'ocean-wave', name: 'Ocean Wave', cost: 350, type: 'gradient', colors: ['#00C9FF', '#92FE9D'], gradientDirection: 'linear' },
  { id: 'sunset-gradient', name: 'Sunset Horizon', cost: 400, type: 'gradient', colors: ['#FF7E5F', '#FEB47B'], gradientDirection: 'linear' },
  { id: 'blueberry-blast', name: 'Blueberry Blast', cost: 450, type: 'gradient', colors: ['#4A00E0', '#8E2DE2'], gradientDirection: 'linear' },
  { id: 'cotton-candy', name: 'Cotton Candy', cost: 500, type: 'gradient', colors: ['#FF9A9E', '#FECFEF'], gradientDirection: 'radial' },
  { id: 'forest-depths', name: 'Forest Depths', cost: 550, type: 'gradient', colors: ['#004D40', '#1DE9B6'], gradientDirection: 'radial' },
  { id: 'amber-glow', name: 'Amber Glow', cost: 600, type: 'gradient', colors: ['#FF6F00', '#FFCA28'], gradientDirection: 'radial' },
  { id: 'twilight', name: 'Twilight', cost: 650, type: 'gradient', colors: ['#141E30', '#243B55'], gradientDirection: 'linear' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', cost: 700, type: 'gradient', colors: ['#F78CA0', '#F9748F', '#FD868C'], gradientDirection: 'radial' },

  // TIER 3: Pattern Skins (750-1200 coins)
  { id: 'cyber-dots', name: 'Cyber Dots', cost: 750, type: 'pattern', colors: ['#0A0A0A', '#00E5FF'], patternType: 'dots' },
  { id: 'zebra', name: 'Zebra', cost: 800, type: 'pattern', colors: ['#FFFFFF', '#333333'], patternType: 'stripes' },
  { id: 'leopard', name: 'Leopard', cost: 850, type: 'pattern', colors: ['#F9A825', '#3E2723'], patternType: 'dots' },
  { id: 'checkerboard', name: 'Checkerboard', cost: 900, type: 'pattern', colors: ['#FFFFFF', '#000000'], patternType: 'stripes' },
  { id: 'polka-party', name: 'Polka Party', cost: 950, type: 'pattern', colors: ['#E91E63', '#FFFFFF'], patternType: 'dots' },
  { id: 'racing-stripes', name: 'Racing Stripes', cost: 1000, type: 'pattern', colors: ['#F44336', '#212121'], patternType: 'stripes' },
  { id: 'camo', name: 'Camo', cost: 1100, type: 'pattern', colors: ['#4CAF50', '#1B5E20', '#8BC34A'], patternType: 'dots' },
  { id: 'confetti', name: 'Confetti', cost: 1200, type: 'pattern', colors: ['#FFFFFF', '#FF4081', '#2196F3', '#FFEB3B', '#4CAF50'], patternType: 'dots' },

  // TIER 4: Animated Skins (1300-2000 coins)
  { id: 'lava-flow', name: 'Lava Flow', cost: 1300, type: 'gradient', colors: ['#FF3D00', '#FF7E5F', '#FEB47B'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'ocean-pulse', name: 'Ocean Pulse', cost: 1400, type: 'gradient', colors: ['#00B4DB', '#0083B0', '#00B4DB'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.8 },
  { id: 'toxic-slime', name: 'Toxic Slime', cost: 1500, type: 'gradient', colors: ['#76FF03', '#64DD17', '#33691E'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 0.7 },
  { id: 'electric-surge', name: 'Electric Surge', cost: 1600, type: 'gradient', colors: ['#64B5F6', '#0D47A1', '#00BCD4', '#006064'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'flow', gradientSpeed: 0.75 },
  { id: 'mystic-aura', name: 'Mystic Aura', cost: 1700, type: 'gradient', colors: ['#9C27B0', '#311B92', '#7B1FA2', '#6A1B9A'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.5 },
  { id: 'neon-glow', name: 'Neon Glow', cost: 1800, type: 'gradient', colors: ['#FF00FF', '#00FFFF'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'galaxy-swirl', name: 'Galaxy Swirl', cost: 1900, type: 'gradient', colors: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'flow', gradientSpeed: 0.5 },
  { id: 'rainbow-swirl', name: 'Rainbow Swirl', cost: 2000, type: 'gradient', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },

  // TIER 5: Premium Skins (2500-5000 coins)
  { id: 'molten-gold', name: 'Molten Gold', cost: 2500, type: 'gradient', colors: ['#FFD700', '#FFA000', '#FF6F00'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.6 },
  { id: 'diamond-frost', name: 'Diamond Frost', cost: 3000, type: 'gradient', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.4 },
  { id: 'plasma-core', name: 'Plasma Core', cost: 3500, type: 'gradient', colors: ['#FF1744', '#F50057', '#D500F9', '#651FFF', '#3D5AFE'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1.2 },
  { id: 'hypnotic', name: 'Hypnotic', cost: 4000, type: 'gradient', colors: ['#000000', '#FFFFFF'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1.5 },
  { id: 'nebula', name: 'Nebula', cost: 5000, type: 'gradient', colors: ['#FF00CC', '#333399', '#FF00CC', '#333399'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'flow', gradientSpeed: 0.8 },
];

const initialTrails: Trail[] = [
  // TIER 1: Basic Trails (500-800 coins)
  { id: 'shadow-fade', name: 'Shadow Fade', cost: 500, type: 'trail', colors: ['#000000', '#808080']},
  { id: 'ruby-trail', name: 'Ruby Trail', cost: 600, type: 'trail', colors: ['#D32F2F', '#B71C1C']},
  { id: 'sapphire-stream', name: 'Sapphire Stream', cost: 700, type: 'trail', colors: ['#1976D2', '#0D47A1']},
  { id: 'emerald-path', name: 'Emerald Path', cost: 800, type: 'trail', colors: ['#2E7D32', '#1B5E20']},

  // TIER 2: Advanced Trails (900-1200 coins)
  { id: 'golden-wake', name: 'Golden Wake', cost: 900, type: 'trail', colors: ['#FFC107', '#FF6F00']},
  { id: 'magma', name: 'Magma Flow', cost: 1000, type: 'trail', colors: ['#FF5722', '#FF9800', '#DD2C00', '#BF360C']},
  { id: 'neon-stream', name: 'Neon Stream', cost: 1100, type: 'trail', colors: ['#00FFFF', '#FF00FF']},
  { id: 'comet-tail', name: 'Comet Tail', cost: 1200, type: 'trail', colors: ['#FFFFFF', '#FFCC00']},

  // TIER 3: Premium Trails (1500-2500 coins)
  { id: 'aurora-borealis', name: 'Aurora Borealis', cost: 1500, type: 'trail', colors: ['#004D40', '#00796B', '#009688', '#00BFA5']},
  { id: 'rainbow-burst', name: 'Rainbow Burst', cost: 1800, type: 'trail', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']},
  { id: 'cosmic-dust', name: 'Cosmic Dust', cost: 2000, type: 'trail', colors: ['#311B92', '#6A1B9A', '#8E24AA', '#D500F9']},
  { id: 'phoenix-flame', name: 'Phoenix Flame', cost: 2500, type: 'trail', colors: ['#FF6D00', '#FFAB00', '#FF3D00', '#DD2C00']},

  // TIER 4: Legendary Trails (3000-5000 coins)
  { id: 'diamond-dust', name: 'Diamond Dust', cost: 3000, type: 'trail', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA']},
  { id: 'void-rift', name: 'Void Rift', cost: 4000, type: 'trail', colors: ['#000000', '#212121', '#000000', '#424242']},
  { id: 'prismatic-wake', name: 'Prismatic Wake', cost: 5000, type: 'trail', colors: ['#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#9C27B0', '#FF9800']}
];

const initialState: ShopState = {
  coins: 0,
  skins: initialSkins,
  purchasedSkins: ['default'],
  equippedSkin: 'default',
  trails: initialTrails,
  purchasedTrails: [],
  equippedTrail: '',
};



// Reset all shop data (coins, purchased skins, equipped skin) to initial
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
        // revert to initial counts
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
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
  { id: 'default', name: 'Steel', cost: 0, type: 'solid', colors: ['#B0BEC5'] },
  { id: 'ocean-gradient', name: 'Ocean Wave', cost: 150, type: 'gradient', colors: ['#00C9FF', '#92FE9D'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'sunset-gradient', name: 'Sunset', cost: 200, type: 'gradient', colors: ['#FF7E5F', '#FEB47B'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'purple-haze', name: 'Purple Haze', cost: 250, type: 'gradient', colors: ['#7C4DFF', '#FF6EC7'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'cyber-dots', name: 'Cyber Dots', cost: 350, type: 'pattern', colors: ['#0A0A0A', '#00E5FF'], patternType: 'dots' },
  { id: 'zebra', name: 'Zebra', cost: 400, type: 'pattern', colors: ['#FFFFFF', '#333333'], patternType: 'stripes' },
  { id: 'gold', name: 'Pure Gold', cost: 600, type: 'gradient', colors: ['#FFD700', '#FFA500'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'lava', name: 'Lava Flow', cost: 750, type: 'gradient', colors: ['#FF3D00', '#FF7E5F', '#FEB47B'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'rainbow', name: 'Rainbow Swirl', cost: 1000, type: 'gradient', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'mystic-aura', name: 'Mystic Aura', cost: 1000, type: 'gradient', colors: ['#9C27B0', '#311B92', '#7B1FA2', '#6A1B9A'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.5 },
  { id: 'electric-surge', name: 'Electric Surge', cost: 1400, type: 'gradient', colors: ['#64B5F6', '#0D47A1', '#00BCD4', '#006064'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'flow', gradientSpeed: 0.75 },
  { id: 'inferno', name: 'Inferno', cost: 1400, type: 'gradient', colors: ['#FF5722', '#FF9800', '#DD2C00', '#BF360C'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 0.75 },
  { id: 'nebula-swirl', name: 'Nebula Swirl', cost: 1600, type: 'gradient', colors: ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'blizzard', name: 'Blizzard', cost: 1600, type: 'gradient', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.75 },
  { id: 'ruby-sparkle', name: 'Ruby Sparkle', cost: 2000, type: 'gradient', colors: ['#C62828', '#D50000', '#FF5252', '#B71C1C'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'pulse', gradientSpeed: 0.75 },
  { id: 'chromatic-burst', name: 'Chromatic Burst', cost: 2200, type: 'gradient', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1.25 },
  { id: 'emerald-dream', name: 'Emerald Dream', cost: 2500, type: 'gradient', colors: ['#4CAF50', '#00796B', '#66BB6A', '#388E3C'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'flow', gradientSpeed: 1.5 },

  // Custom fun skins
  { id: 'galaxy-swirl', name: 'Galaxy Swirl', cost: 1200, type: 'gradient', colors: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'], gradientDirection: 'radial', animated: true, gradientAnimationType: 'flow', gradientSpeed: 0.5 },
  { id: 'neon-glow', name: 'Neon Glow', cost: 1800, type: 'gradient', colors: ['#FF00FF', '#00FFFF'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'prism-spectrum', name: 'Prism Spectrum', cost: 2000, type: 'gradient', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'], gradientDirection: 'linear', animated: true, gradientAnimationType: 'cycle', gradientSpeed: 1 },
  { id: 'checkerboard', name: 'Checkerboard', cost: 2500, type: 'pattern', colors: ['#FFFFFF', '#000000'], patternType: 'stripes' },
  { id: 'confetti-fun', name: 'Confetti Fun', cost: 3000, type: 'pattern', colors: ['#FF385C', '#FFBF00', '#1CE6FF', '#FF34FF', '#FF4A46'], patternType: 'dots' },
];

const initialTrails: Trail[] = [
  { id: 'neon-stream', name: 'Neon Stream', cost: 1000, type: 'trail', colors: ['#00FFFF', '#FF00FF']},
  { id: 'comet-tail', name: 'Comet Tail', cost: 1200, type: 'trail', colors: ['#FFFFFF', '#FFCC00']},
  { id: 'shadow-fade', name: 'Shadow Fade', cost: 800, type: 'trail', colors: ['#000000', '#808080']},
  { id: 'rainbow-burst', name: 'Rainbow Burst', cost: 1500, type: 'trail', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']},
  { id: 'magma', name: 'Magma', cost: 1000, type: 'trail', colors: ['#FF5722', '#FF9800', '#DD2C00', '#BF360C']},
  { id: 'aurora-borealis', name: 'Aurora Borealis', cost: 1400, type: 'trail', colors: ['#004D40', '#00796B', '#009688', '#00BFA5']}
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
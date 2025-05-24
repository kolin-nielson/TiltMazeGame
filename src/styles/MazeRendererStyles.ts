import { StyleSheet } from 'react-native';

export const mazeRendererStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 16, // MD3 rounded corner (large)
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1, // MD3 elevation level 1
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mazeElementsContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    aspectRatio: 1, // Force square aspect ratio
    maxWidth: '95%', // Optimal size for gameplay
    maxHeight: '95%', // Maintain proportional height
  },
  wall: {
    position: 'absolute',
  },
  ball: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2, // MD3 shadow opacity
    shadowRadius: 4, // MD3 shadow blur
  },
  goal: {
    position: 'absolute',
    opacity: 0.9, // Slightly more visible
  },
});

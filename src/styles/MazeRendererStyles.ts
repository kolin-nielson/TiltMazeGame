import { StyleSheet } from 'react-native';

export const mazeRendererStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mazeElementsContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  goal: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    opacity: 0.85,
  },
});

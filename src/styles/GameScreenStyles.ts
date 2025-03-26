import { StyleSheet } from 'react-native';

export const gameScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
  gameContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mazeSurface: {
    width: '85%',
    maxWidth: 380,
    aspectRatio: 1,
    borderRadius: 12,
    alignSelf: 'center',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    marginTop: 30,
  },
  timerContainer: {
    marginBottom: 15,
    alignSelf: 'center',
    padding: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  messageCard: {
    width: '80%',
    borderRadius: 12,
    alignSelf: 'center',
    paddingVertical: 16,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  instructions: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 8,
  },
  pauseButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  statsContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  debugSurface: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  debugText: {
    fontSize: 12,
  },
});

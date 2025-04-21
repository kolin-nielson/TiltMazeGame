import { StyleSheet } from 'react-native';

export const gameScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mazeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mazeSurface: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 500,
    maxHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  timerContainer: {
    marginBottom: 15,
    alignSelf: 'center',
    padding: 10,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '500',
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
    bottom: 30,
    alignSelf: 'center',
  },
  resetTiltButton: {
    minWidth: 'auto',
    paddingHorizontal: 4,
    marginLeft: 'auto',
  },
  resetTiltButtonLabel: {
    fontSize: 12,
    marginVertical: 0,
    marginHorizontal: 4,
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayContent: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 10,
    minWidth: 250,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  overlayText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  overlayButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  overlayButton: {
    marginHorizontal: 10,
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
  quitButton: {
    minWidth: 'auto',
    paddingHorizontal: 4,
    marginRight: 10,
  },
  quitButtonLabel: {
    fontSize: 12,
    marginVertical: 0,
    marginHorizontal: 4,
  },
  iconButton: {
    margin: 0,
  },

  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

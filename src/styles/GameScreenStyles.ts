import { StyleSheet } from 'react-native';

export const gameScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  appbarTitle: {
    fontSize: 22,
    fontWeight: '500', // MD3 typography weight
    textAlign: 'center',
    letterSpacing: 0,
  },
  mazeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, // MD3 standard spacing unit
  },
  mazeOuterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, // MD3 standard spacing
    paddingVertical: 8,
    marginBottom: 8,
  },
  mazeSurface: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 800,
    maxHeight: '95%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16, // MD3 rounded corner (large)
    overflow: 'hidden',
    elevation: 2, // MD3 elevation level 2
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  timerContainer: {
    marginBottom: 16,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12, // MD3 rounded corner (medium)
    elevation: 1, // MD3 elevation level 1
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '500', // MD3 title medium weight
    letterSpacing: 0.1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // MD3 scrim opacity
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  messageCard: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16, // MD3 rounded corner (large)
    alignSelf: 'center',
    paddingVertical: 24,
    elevation: 3, // MD3 elevation level 3
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 24,
    fontWeight: '500', // MD3 headline small weight
    letterSpacing: 0,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16, // MD3 standard spacing
  },
  instructions: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400', // MD3 body large weight
    lineHeight: 24,
    letterSpacing: 0.5,
    marginVertical: 12,
  },
  pauseButton: {
    position: 'absolute',
    bottom: 32, // MD3 spacing from edge
    alignSelf: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  resetTiltButton: {
    minWidth: 'auto',
    paddingHorizontal: 12,
    marginLeft: 'auto',
    borderRadius: 20, // MD3 rounded corner (full)
  },
  resetTiltButtonLabel: {
    fontSize: 12,
    fontWeight: '500', // MD3 label small weight
    letterSpacing: 0.5,
    marginVertical: 0,
    marginHorizontal: 8,
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // MD3 scrim opacity
  },
  overlayContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16, // MD3 rounded corner (large)
    minWidth: 280,
    maxWidth: '90%',
    elevation: 3, // MD3 elevation level 3
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: '500', // MD3 headline small weight
    letterSpacing: 0,
    marginBottom: 24,
    textAlign: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '400', // MD3 body large weight
    lineHeight: 24,
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  overlayButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
    gap: 16,
  },
  overlayButton: {
    flex: 1,
    marginHorizontal: 0,
    borderRadius: 20, // MD3 rounded corner (full)
  },
  statsContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12, // MD3 rounded corner (medium)
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500', // MD3 title small weight
    letterSpacing: 0.1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600', // MD3 title medium weight
    letterSpacing: 0.1,
  },
  quitButton: {
    minWidth: 'auto',
    paddingHorizontal: 12,
    marginRight: 12,
    borderRadius: 20, // MD3 rounded corner (full)
  },
  quitButtonLabel: {
    fontSize: 12,
    fontWeight: '500', // MD3 label small weight
    letterSpacing: 0.5,
    marginVertical: 0,
    marginHorizontal: 8,
  },
  iconButton: {
    margin: 0,
    borderRadius: 20, // MD3 rounded corner (full)
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, // MD3 standard spacing
  },
});

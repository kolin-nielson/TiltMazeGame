import { store, useAppSelector, useAppDispatch } from '@store';
import { loadSettings } from '@store/slices/settingsSlice';
import { loadTheme, setIsDark } from '@store/slices/themeSlice';
import { loadShopData } from '@store/slices/shopSlice';
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        dispatch(loadSettings()),
        dispatch(loadTheme()),
        dispatch(loadShopData())
      ]);
      setIsLoading(false);
    };
    loadInitialData();
  }, [dispatch]);
  return (
  );
};
export default AppContent; 
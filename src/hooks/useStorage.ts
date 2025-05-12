import { useState, useEffect, useCallback } from 'react';
import storageService from '../storage/StorageService';
export function useStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        const storedValue = await storageService.load<T>(key, initialValue || null);
        setValue(storedValue);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key, initialValue]);
  const updateValue = useCallback(
    async (newValue: T | null | ((prev: T | null) => T | null)) => {
      try {
        setLoading(true);
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        if (valueToStore === null) {
          await storageService.remove(key);
        } else {
          await storageService.save(key, valueToStore);
        }
        setValue(valueToStore);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [key, value]
  );
  const removeValue = useCallback(async () => {
    try {
      setLoading(true);
      await storageService.remove(key);
      setValue(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key]);
  return { value, setValue: updateValue, removeValue, loading, error };
}
export default useStorage;

import { useState, useEffect } from 'react';

// Check if localStorage is available and has space
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Get size of data in bytes
const getDataSize = (data) => {
  return new Blob([JSON.stringify(data)]).size;
};

// Check if data will fit in localStorage (typical limit is 5-10MB)
const checkQuota = (data) => {
  const size = getDataSize(data);
  const maxSize = 5 * 1024 * 1024; // 5MB conservative limit

  if (size > maxSize) {
    console.warn(`Data size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit`);
    return false;
  }
  return true;
};

// Custom hook for localStorage with quota handling
export const useLocalStorageWithQuota = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (!isLocalStorageAvailable()) {
        console.warn('localStorage is not available, changes will not persist');
        return;
      }

      // Check quota before saving
      if (!checkQuota(valueToStore)) {
        throw new Error('Data exceeds localStorage quota. Consider reducing data size.');
      }

      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('localStorage quota exceeded. Clearing old data...');
        // Try to clear some space and retry
        try {
          localStorage.removeItem(key);
          localStorage.setItem(key, JSON.stringify(valueToStore));
          console.log('Successfully saved after clearing space');
        } catch (retryError) {
          console.error('Failed to save even after clearing space:', retryError);
          alert('Unable to save data: Storage quota exceeded. Please clear some browser data or use a smaller dataset.');
        }
      } else {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  };

  const removeValue = () => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};

// Hook for multiple localStorage values
export const useMultipleLocalStorage = () => {
  const [data, setData, removeData] = useLocalStorageWithQuota('webVitalsData', []);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('both');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Load all values on mount
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    try {
      const savedStartDate = localStorage.getItem('webVitalsStartDate');
      const savedEndDate = localStorage.getItem('webVitalsEndDate');
      const savedMetric = localStorage.getItem('webVitalsSelectedMetric');
      const savedBrand = localStorage.getItem('webVitalsSelectedBrand');

      if (savedStartDate) setStartDate(savedStartDate);
      if (savedEndDate) setEndDate(savedEndDate);
      if (savedMetric) setSelectedMetric(savedMetric);
      if (savedBrand) setSelectedBrand(savedBrand);
    } catch (error) {
      console.error('Error loading localStorage values:', error);
    }
  }, []);

  // Save individual values
  useEffect(() => {
    if (startDate && isLocalStorageAvailable()) {
      localStorage.setItem('webVitalsStartDate', startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate && isLocalStorageAvailable()) {
      localStorage.setItem('webVitalsEndDate', endDate);
    }
  }, [endDate]);

  useEffect(() => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem('webVitalsSelectedMetric', selectedMetric);
    }
  }, [selectedMetric]);

  useEffect(() => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem('webVitalsSelectedBrand', selectedBrand);
    }
  }, [selectedBrand]);

  const clearAll = () => {
    if (isLocalStorageAvailable()) {
      localStorage.clear();
    }
    removeData();
    setStartDate('');
    setEndDate('');
    setSelectedMetric('both');
    setSelectedBrand('all');
  };

  return {
    data,
    setData,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedMetric,
    setSelectedMetric,
    selectedBrand,
    setSelectedBrand,
    clearAll
  };
};

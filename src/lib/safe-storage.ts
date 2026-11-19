export const readBrowserStorage = (key: string): null | string => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeBrowserStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

// Whether values can be stored, so a choice made once is remembered.
export const isBrowserStorageAvailable = (): boolean => {
  const probe = '__storage-probe__';
  try {
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

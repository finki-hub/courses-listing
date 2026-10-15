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

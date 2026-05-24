export type Variables = Record<string, string>;

const STORAGE_KEY = 'label_variables_v1';

export const loadVariables = (): Variables => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Variables;
  } catch {
    return {};
  }
};

export const saveVariables = (vars: Variables) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));
  } catch {
    // ignore
  }
};

export const clearVariables = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

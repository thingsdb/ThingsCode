import { createContext } from "react";

interface ThemeContextType {
  appearance: 'light' | 'dark';
  toggleAppearance: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

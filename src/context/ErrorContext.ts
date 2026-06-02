import { createContext } from "react";

interface ErrorContextType {
  errorMessage: string | null;
  setErrorMessage: (string: string | null) => void;
}

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

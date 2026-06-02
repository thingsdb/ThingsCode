import React, { useState } from 'react';
import { ErrorContext } from '../context';

interface ErrorProviderProps {
  children: React.ReactNode;
}

export function ErrorProvider({children}: ErrorProviderProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <ErrorContext.Provider value={{
      errorMessage,
      setErrorMessage,
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

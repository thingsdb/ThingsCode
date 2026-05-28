import { useEffect, useState } from 'react';
import '@radix-ui/themes/styles.css';
import './App.css';
import App from './App';
import { Theme, Box } from '@radix-ui/themes';
import { WorkspaceProvider } from './providers';
import { ThemeContext } from './context';
import { WebSocketProvider } from './providers/WebSocketProvider';


function Root() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('ticode-theme');

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';  // If OS has light preference
    }
    return 'dark';  // default
  });

  const toggleAppearance = () => {
    setAppearance((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('ticode-theme', appearance);
  }, [appearance]);

  return (
    <WebSocketProvider>
      <ThemeContext.Provider value={{ appearance, toggleAppearance }}>
        <Theme appearance={appearance} accentColor="iris" panelBackground="translucent">
          <Box
            style={{
              position: 'relative',
              minHeight: '100vh',
              width: '100vw',
              overflowX: 'hidden'
            }}
          >
            <WorkspaceProvider appearance={appearance}>
              <App />
            </WorkspaceProvider>
          </Box>
        </Theme>
      </ThemeContext.Provider>
    </WebSocketProvider>
  );
}

export default Root;
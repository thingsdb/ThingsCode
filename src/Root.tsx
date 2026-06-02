import { useEffect, useState } from 'react';
import '@radix-ui/themes/styles.css';
import './App.css';
import App from './App';
import { Theme, Box } from '@radix-ui/themes';
import { WorkspaceProvider, WebSocketProvider, EventProvider, ErrorProvider } from './providers';
import { ThemeContext } from './context';


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
    <EventProvider>
      <WebSocketProvider>
        <ThemeContext.Provider value={{ appearance, toggleAppearance }}>
          <Theme appearance={appearance} accentColor="iris" panelBackground="translucent">
            <ErrorProvider>
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
            </ErrorProvider>
          </Theme>
        </ThemeContext.Provider>
      </WebSocketProvider>
    </EventProvider>
  );
}

export default Root;
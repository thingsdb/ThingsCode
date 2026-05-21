import { useState } from 'react';
import App from './App';
import '@radix-ui/themes/styles.css';
import { Theme, Button, Tooltip, Flex, Box } from '@radix-ui/themes';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';

function Root() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('dark');

  const toggleAppearance = () => {
    setAppearance((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Theme appearance={appearance} accentColor="iris" panelBackground="translucent">
      <Box
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100vw',
          overflowX: 'hidden'
        }}
      >
        <Flex justify="end" p="2" style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
          <Tooltip content={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <Button
              variant="ghost"
              onClick={toggleAppearance}
              size="2"
              style={{ cursor: 'pointer' }}
            >
              {appearance === 'dark' ? (
                <SunIcon width="16" height="16" />
              ) : (
                <MoonIcon width="16" height="16" />
              )}
            </Button>
          </Tooltip>
        </Flex>
        <App />
      </Box>
      <App />
    </Theme>
  );
}

export default Root;
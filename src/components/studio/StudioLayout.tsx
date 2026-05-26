// src/components/studio/StudioLayout.tsx
import { Flex } from '@radix-ui/themes';
import StudioTopBar from './StudioTopBar';
import StudioLeftPanel from './StudioLeftPanel';
import StudioCenterEditor from './StudioCenterEditor';
import StudioRightPanel from './StudioRightPanel';

export default function StudioLayout() {
  return (
    <Flex
      direction="column"
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <StudioTopBar />
      <Flex style={{ flexGrow: 1, height: 'calc(100vh - 40px)' }}>
        <StudioLeftPanel />
        <StudioCenterEditor />
        <StudioRightPanel />
      </Flex>
    </Flex>
  );
}
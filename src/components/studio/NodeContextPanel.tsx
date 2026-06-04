import { useState } from 'react';
import { Card, Flex, Text, Box, Em } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import NodeInfoPanel from './NodeInfoPanel';
import NodeCountersPanel from './NodeCountersPanel';

interface NodeContextPanelProps {
  scope: string;
}

export default function NodeContextPanel({ scope }: NodeContextPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(() => {
    try {
      const storedSection = localStorage.getItem('ticode-node-context-section');
      return storedSection;
    } catch {
      return null;
    }
  });

  const toggleSection = (sectionName: string) => {
    if (openSection === sectionName) {
      setOpenSection(null);  // Collapse if clicked again
      try {
        localStorage.removeItem('ticode-node-context-section');
      } catch {
        // ignore error
      }
    } else {
      setOpenSection(sectionName);
      try {
        localStorage.setItem('ticode-node-context-section', sectionName);
      } catch {
        // ignore error
      }
    }
  };

  return (
    <Flex direction="column" gap="5" style={{paddingTop: '8px'}}>

      {/* NODE INFO */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('node-info')}
        >
          <Text size="2" weight="bold">Node Info</Text>
          {openSection === 'node-info' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'node-info' && (
          <NodeInfoPanel scope={scope} />
        )}
      </Card>

      {/* COUNTERS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('counters')}
        >
          <Text size="2" weight="bold">Counters</Text>
          {openSection === 'counters' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'counters' && (
          <NodeCountersPanel scope={scope} />
        )}
      </Card>

      {/* BACKUPS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('backups')}
        >
          <Text size="2" weight="bold">Backups</Text>
          {openSection === 'backups' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'backups' && <Box pb="3"><Text size="1" color="gray"><Em>Backups coming soon...</Em></Text></Box>}
      </Card>

      {/* MODULES */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('modules')}
        >
          <Text size="2" weight="bold">Modules</Text>
          {openSection === 'modules' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'modules' && <Box pb="3"><Text size="1" color="gray"><Em>Modules coming soon...</Em></Text></Box>}
      </Card>
    </Flex>
  );
}
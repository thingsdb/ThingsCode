import { useState } from 'react';
import { Card, Flex, Text, Em } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import CollectionRoomsPanel from './CollectionRoomsPanel';

interface CollectionContextPanelProps {
  scope: string;
}

export default function CollectionContextPanel({ scope }: CollectionContextPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(() => {
    try {
      const storedSection = localStorage.getItem('ticode-collection-context-section');
      return storedSection;
    } catch {
      return null;
    }
  });

  const toggleSection = (sectionName: string) => {
    if (openSection === sectionName) {
      setOpenSection(null);  // Collapse if clicked again
      try {
        localStorage.removeItem('ticode-collection-context-section');
      } catch {
        // ignore error
      }
    } else {
      setOpenSection(sectionName);
      try {
        localStorage.setItem('ticode-collection-context-section', sectionName);
      } catch {
        // ignore error
      }
    }
  };

  return (
    <Flex direction="column" gap="5" style={{paddingTop: '8px'}}>

      {/* ROOMS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('rooms')}
        >
          <Text size="2" weight="bold">Rooms</Text>
          {openSection === 'rooms' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'rooms' && <CollectionRoomsPanel scope={scope} />}
      </Card>
    </Flex>
  );
}
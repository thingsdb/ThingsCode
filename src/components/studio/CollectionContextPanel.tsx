import { useState } from 'react';
import { Card, Flex, Text } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import RoomsPanel from './RoomsPanel';
import TasksPanel from './TasksPanel';
import ProceduresPanel from './ProceduresPanel';
import EnumsPanel from './EnumsPanel';
import ThingExplorer from '../ThingExplorer';
import TypesPanel from './TypesPanel';
import HistoryPanel from './HistoryPanel';

interface CollectionContextPanelProps {
  scope: string;
  requireCommit: boolean;
}

export default function CollectionContextPanel({ scope, requireCommit }: CollectionContextPanelProps) {
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
          className="cursor-pointer select-none"
          onClick={() => { toggleSection('rooms'); }}
        >
          <Text size="2" weight="bold">Rooms</Text>
          {openSection === 'rooms' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'rooms' && <RoomsPanel scope={scope} />}
      </Card>

      {/* TASKS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          className="cursor-pointer select-none"
          onClick={() => { toggleSection('tasks'); }}
        >
          <Text size="2" weight="bold">Tasks</Text>
          {openSection === 'tasks' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'tasks' && <TasksPanel scope={scope} />}
      </Card>

      {/* PROCEDURES */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          className="cursor-pointer select-none"
          onClick={() => { toggleSection('procedures'); }}
        >
          <Text size="2" weight="bold">Procedures</Text>
          {openSection === 'procedures' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'procedures' && <ProceduresPanel scope={scope} />}
      </Card>

      {/* ENUMS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          className="cursor-pointer select-none"
          onClick={() => { toggleSection('enums'); }}
        >
          <Text size="2" weight="bold">Enums</Text>
          {openSection === 'enums' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'enums' && <EnumsPanel scope={scope} />}
      </Card>

      {/* TYPES */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          className="cursor-pointer select-none"
          onClick={() => { toggleSection('types'); }}
        >
          <Text size="2" weight="bold">Types</Text>
          {openSection === 'types' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'types' && <TypesPanel scope={scope} />}
      </Card>

      {/* EXPLORER */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          className="cursor-pointer select-none"
          onClick={() => { toggleSection('explorer'); }}
        >
          <Text size="2" weight="bold">Explorer</Text>
          {openSection === 'explorer' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'explorer' && <ThingExplorer scope={scope} startThingId={1} />}
      </Card>

      {/* HISTORY */}
      {requireCommit && (
        <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
          <Flex
            align="center"
            justify="between"
            py="1"
            className="cursor-pointer select-none"
            onClick={() => { toggleSection('history'); }}
          >
            <Text size="2" weight="bold">History</Text>
            {openSection === 'history' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
          </Flex>
          {openSection === 'history' && <HistoryPanel scope={scope} />}
        </Card>
      )}

    </Flex>
  );
}
import { useState } from 'react';
import { Card, Flex, Text } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import TasksPanel from './TasksPanel';
import ProceduresPanel from './ProceduresPanel';
import UsersPanel from './UserPanel';
import HistoryPanel from './HistoryPanel';
import ModulesPanel from './ModulesPanel';

interface ThingsDBContextPanelProps {
  scope: string;
  requireCommit: boolean;
}

export default function ThingsDBContextPanel({ scope, requireCommit }: ThingsDBContextPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(() => {
    try {
      const storedSection = localStorage.getItem('ticode-thingsdb-context-section');
      return storedSection;
    } catch {
      return null;
    }
  });

  const toggleSection = (sectionName: string) => {
    if (openSection === sectionName) {
      setOpenSection(null);  // Collapse if clicked again
      try {
        localStorage.removeItem('ticode-thingsdb-context-section');
      } catch {
        // ignore error
      }
    } else {
      setOpenSection(sectionName);
      try {
        localStorage.setItem('ticode-thingsdb-context-section', sectionName);
      } catch {
        // ignore error
      }
    }
  };

  return (
    <Flex direction="column" gap="5" style={{paddingTop: '8px'}}>

      {/* TASKS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('tasks')}
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
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('procedures')}
        >
          <Text size="2" weight="bold">Procedures</Text>
          {openSection === 'procedures' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'procedures' && <ProceduresPanel scope={scope} />}
      </Card>

      {/* USERS */}
      <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('users')}
        >
          <Text size="2" weight="bold">Users</Text>
          {openSection === 'users' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'users' && <UsersPanel />}
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
        {openSection === 'modules' && <ModulesPanel scope={scope} />}
      </Card>

      {/* HISTORY */}
      {requireCommit && (
        <Card size="1" variant="ghost" style={{ padding: '15px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
          <Flex
            align="center"
            justify="between"
            py="1"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleSection('history')}
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
import { useState, useEffect, useMemo, useCallback, type KeyboardEvent } from 'react';
import { Dialog, Flex, Box, Text, Badge, VisuallyHidden } from '@radix-ui/themes';
import { FileIcon, LayersIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useTheme } from '../hooks';
import { SearchIndexType, type SearchRecord } from '../types';

interface TicodeSearchProps {
  onClose: () => void;
  scopes: { name: string }[];
  files: { filename: string }[];
  onSelect: (item: SearchRecord) => void;
}

export default function TicodeSearch({
  onClose,
  scopes,
  files,
  onSelect,
}: TicodeSearchProps) {
  const { appearance } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const lookupRegistry = useMemo(() => {
    const records: SearchRecord[] = [];

    scopes.forEach((s) => {
      records.push({
        id: `scope-${s.name}`,
        name: s.name,
        type: SearchIndexType.Scope,
      });
    });

    files.forEach((f) => {
      records.push({
        id: `file-${f.filename}`,
        name: f.filename,
        type: SearchIndexType.File,
      });
    });

    return records;
  }, [scopes, files]);

  const filteredResults = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return lookupRegistry;

    return lookupRegistry.filter(item => item.name.toLowerCase().includes(query));
  }, [searchTerm, lookupRegistry]);

  useEffect(() => {
    queueMicrotask(() => { setSelectedIndex(0); });
  }, [searchTerm]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (filteredResults.length === 0) return;

      switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          onSelect(filteredResults[selectedIndex]);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      }
    },
    [filteredResults, selectedIndex, onSelect, onClose]
  );

  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Content
        aria-describedby={undefined}
        style={{
          width: '550px',
          maxWidth: '90vw',
          padding: 0,
          overflow: 'hidden',
          top: '15%',
          transform: 'translateY(0)',
        }}
      >
        <VisuallyHidden><Dialog.Title>Search</Dialog.Title></VisuallyHidden>
        <Flex
          align="center"
          px="4"
          style={{
            height: '48px',
            borderBottom: '1px solid var(--gray-5)',
            backgroundColor: appearance === 'dark' ? 'var(--gray-2)' : 'var(--gray-1)',
          }}
        >
          <Box mr="3" style={{ color: 'var(--gray-9)', display: 'flex' }}>
            <MagnifyingGlassIcon width="18" height="18" />
          </Box>
          <input
            placeholder="Search workspace files or scopes..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              flexGrow: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'var(--gray-12)',
              fontFamily: 'inherit',
            }}
          />
          <Text size="1" color="gray" style={{ userSelect: 'none', fontVariantNumeric: 'tabular-nums' }}>
            {filteredResults.length} found
          </Text>
        </Flex>

        <Box p="2" style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {filteredResults.length === 0 ? (
            <Flex align="center" justify="center" style={{ height: '80px' }}>
              <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
                No matches for "{searchTerm}"
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap="1">
              {filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isFile = item.type === SearchIndexType.File;

                return (
                  <Flex
                    key={item.id}
                    align="center"
                    justify="between"
                    px="3"
                    py="2"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    onMouseEnter={() => { setSelectedIndex(index); }}
                    style={{
                      borderRadius: 'var(--radius-2)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--iris-9)' : 'transparent',
                    }}
                  >
                    <Flex align="center" gap="3">
                      <Box style={{ color: isSelected ? '#fff' : 'var(--gray-9)', display: 'flex' }}>
                        {isFile ? <FileIcon width="16" height="16" /> : <LayersIcon width="16" height="16" />}
                      </Box>
                      <Text
                        size="2"
                        weight="medium"
                        style={{ color: isSelected ? '#fff' : 'var(--gray-12)' }}
                      >
                        {item.name}
                      </Text>
                    </Flex>

                    <Box>
                      <Badge
                        size="1"
                        variant={isSelected ? 'solid' : 'surface'}
                        color={isSelected ? 'iris' : 'gray'}
                      >
                        {item.type}
                      </Badge>
                    </Box>
                  </Flex>
                );
              })}
            </Flex>
          )}
        </Box>

        <Flex
          justify="end"
          gap="3"
          px="3"
          py="2"
          style={{
            borderTop: '1px solid var(--gray-4)',
            backgroundColor: 'var(--gray-2)'
          }}
        >
          <Text size="1" color="gray">
            <kbd style={{ fontFamily: 'monospace', background: 'var(--gray-4)', padding: '2px 4px', borderRadius: '4px' }}>↑↓</kbd> Navigate
          </Text>
          <Text size="1" color="gray">
            <kbd style={{ fontFamily: 'monospace', background: 'var(--gray-4)', padding: '2px 4px', borderRadius: '4px' }}>Enter</kbd> Select
          </Text>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
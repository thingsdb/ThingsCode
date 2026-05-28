import { useState } from 'react';
import { Flex, Box, Text, Button, ScrollArea, IconButton, TextField } from '@radix-ui/themes';
import { PlusIcon, FileIcon, Pencil2Icon, TrashIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useActiveWorkspace } from '../../hooks';

export default function StudioLeftPanel() {
  const { files, loading, activeFilename, setActiveFile } = useActiveWorkspace();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter((file) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      file.filename.toLowerCase().includes(query) ||
      (file.content && file.content.toLowerCase().includes(query))
    );
  });

  const handleCreateFile = () => {
    // TODO
    console.log("Create file action invoked");
  };

  const handleRenameFile = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    const newName = prompt(`Enter a new name for ${filename}:`, filename);
    if (newName && newName.trim() !== '' && newName !== filename) {
      console.log(`Rename file request from ${filename} to ${newName}`);
      // emit('RENAME_FILE', { old: filename, new: newName })
    }
  };

  const handleDeleteFile = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    if (confirm(`Are you absolutely sure you want to permanently delete ${filename}?`)) {
      console.log(`Delete file target request: ${filename}`);
      // emit('DELETE_FILE', { filename })
    }
  };

  const handleSelectFile = (e: React.MouseEvent, filename: string) => {
    setActiveFile(filename);
  }

  return (
    <Flex
      direction="column"
      style={{
        width: 'auto',
        backgroundColor: 'var(--gray-1)',
        height: '100%'
      }}
    >
      {/* Header Actions */}
      <Flex p="2" align="center" justify="between" style={{ borderBottom: '1px solid var(--gray-3)' }}>
        <Text size="1" weight="bold" color="gray">WORKSPACE FILES</Text>
        <IconButton
          size="1"
          variant="soft"
          color="green"
          onClick={handleCreateFile}
          style={{ cursor: 'pointer' }}
        >
          <PlusIcon width="12" height="12" />
        </IconButton>
      </Flex>

      {/* Search */}
      <Box px="2" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
        <TextField.Root
          placeholder="Search name or content..."
          size="1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="12" width="12" />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Project Files */}
      <Box style={{ flexGrow: 1, overflow: 'hidden' }}>
        <ScrollArea type="auto" style={{ height: 'calc(100vh - 85px)' }}>
          <Flex direction="column" p="1" gap="1">
            {loading ? (
              <Box p="2"><Text size="1" color="gray">Scanning folder...</Text></Box>
            ) : filteredFiles.length === 0 ? (
              <Box p="2"><Text size="1" color="gray">No files matched search</Text></Box>
            ) : (
              filteredFiles.map((file) => (
                <Box
                  key={file.filename}
                  className="file-explorer-row"
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <Button
                    // 🔑 Switching from 'ghost' to 'solid' adds a beautiful background pill container
                    variant={file.filename === activeFilename ? 'solid' : 'ghost'}
                    color={file.filename === activeFilename ? 'iris' : 'gray'}
                    size="1"
                    style={{
                      width: '100%',
                      justifyContent: 'start',
                      cursor: 'pointer',
                      textAlign: 'left',
                      paddingRight: '56px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'block',
                      transition: 'background-color 0.1s ease, color 0.1s ease',
                    }}
                    onClick={(e) => handleSelectFile(e, file.filename)}
                  >
                    <Flex align="center" gap="2" style={{ width: '100%', overflow: 'hidden' }}>
                      <FileIcon width="12" height="12" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          display: 'block'
                        }}
                      >
                        {file.filename}
                      </span>
                    </Flex>
                  </Button>

                  <Flex
                    className="file-action-buttons"
                    gap="1"
                    align="center"
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: file.filename === activeFilename ? '10px' : '7px',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                    }}
                  >
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      title="Rename File"
                      onClick={(e) => handleRenameFile(e, file.filename)}
                      style={{ cursor: 'pointer', height: '18px', width: '18px' }}
                    >
                      <Pencil2Icon width="10" height="10" />
                    </IconButton>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      title="Delete File"
                      onClick={(e) => handleDeleteFile(e, file.filename)}
                      style={{ cursor: 'pointer', height: '18px', width: '18px' }}
                    >
                      <TrashIcon width="10" height="10" />
                    </IconButton>
                  </Flex>
                </Box>
              ))
            )}
          </Flex>
        </ScrollArea>
      </Box>

      {/* 🎨 Injection of native hover CSS rules */}
      <style>{`
        .file-action-buttons {
          opacity: 0;
          transition: opacity 0.1s ease-in-out;
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex;
          gap: 4px;
        }

        .file-explorer-row:hover .file-action-buttons {
          opacity: 1;
        }

        .file-explorer-row:has(button[data-variant="solid"]) .file-action-buttons {
          background-color: var(--iris-9);
        }
        .file-explorer-row:has(button[data-variant="solid"]) .file-action-buttons button {
          color: white !important;
        }
        .file-explorer-row:has(button[data-variant="solid"]) .file-action-buttons button:hover {
          background-color: var(--iris-10) !important;
        }

      `}</style>
    </Flex>
  );
}
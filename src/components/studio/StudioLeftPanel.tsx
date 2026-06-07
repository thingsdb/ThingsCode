import { useState } from 'react';
import { Flex, Box, Text, Button, ScrollArea, IconButton, TextField, Tooltip } from '@radix-ui/themes';
import { PlusIcon, FileIcon, Pencil2Icon, TrashIcon, MagnifyingGlassIcon, UpdateIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useActiveWorkspace } from '../../hooks';
import RenameFileDialog from './RenameFileDialog';
import { ConfirmDialog } from '..';
import CreateFileDialog from './CreateFileDialog';

interface StudioLeftPanelProps {
  isCreateOpen: boolean;
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function StudioLeftPanel({ isCreateOpen, setIsCreateOpen }: StudioLeftPanelProps) {
  const { files, loading, activeFilename, refreshFiles, createFile, renameFile, deleteFile, setActiveFile } = useActiveWorkspace();
  const [searchQuery, setSearchQuery] = useState('');

  // Refresh files
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rename Dialog
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState('');

  // Delete Dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState('');

  const filteredFiles = files.filter((file) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      file.filename.toLowerCase().includes(query) ||
      (file.content && file.content.toLowerCase().includes(query))
    );
  });

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreateOpen(true);
  };

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const refresh = async () => {
      setIsRefreshing(true);
      await refreshFiles();
      setIsRefreshing(false);
    };
    refresh();
  };

  const handleCreateConfirm = (filename: string) => {
    console.log(`Create new file request for ${filename}`);
    createFile(filename);
  };

  const handleRenameClick = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    setFileToRename(filename);
    setIsRenameOpen(true);
  };

  const handleRenameConfirm = (oldName: string, newName: string) => {
    console.log(`Rename file request from ${oldName} to ${newName}`);
    renameFile(oldName, newName);
  };

  const handleDeleteClick = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    setFileToDelete(filename);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = (filename: string) => {
    console.log(`Delete file request for ${filename}`);
    deleteFile(filename);
  };

  const handleSelectFile = (_: React.MouseEvent, filename: string) => {
    setActiveFile(filename);
  };

  return (
    <>
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
          <Flex gap="1">
            <Tooltip content="Refresh workspace files">
              <IconButton
                size="1"
                variant="soft"
                color="gray"
                disabled={loading || isRefreshing}
                onClick={handleRefreshClick}
                style={{ cursor: 'pointer' }}
              >
                <UpdateIcon width="12" height="12" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Add new workspace file">
              <IconButton
                size="1"
                variant="soft"
                color="iris"
                disabled={loading || isRefreshing}
                onClick={handleCreateClick}
                style={{ cursor: 'pointer' }}
              >
                <PlusIcon width="12" height="12" />
              </IconButton>
            </Tooltip>
            </Flex>
        </Flex>

        {/* Search */}
        <Box px="2" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
          <TextField.Root
            placeholder="Search name or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="1"
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="14" width="14" />
            </TextField.Slot>
            {searchQuery && (
              <TextField.Slot style={{ paddingRight: '4px' }}>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setSearchQuery('')}
                  style={{ cursor: 'pointer', height: '16px', width: '16px' }}
                >
                  <Cross2Icon height="12" width="12" />
                </IconButton>
              </TextField.Slot>
            )}
          </TextField.Root>
        </Box>

        {/* Project Files */}
        <Box style={{ flexGrow: 1, overflow: 'hidden' }}>
          <ScrollArea
            type="auto"
            style={{ height: 'calc(100vh - 85px)' }}
          >
            <Flex direction="column" p="1" gap="1">
              {loading || isRefreshing ? (
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
                      maxWidth: '100%',
                    }}
                  >
                    <Button
                      variant="ghost"
                      color={file.filename === activeFilename ? 'iris' : 'gray'}
                      size="1"
                      style={{
                        maxWidth: '100%',
                        justifyContent: 'start',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                      }}
                      onClick={(e) => handleSelectFile(e, file.filename)}
                    >
                      <Flex align="center" gap="2" style={{ overflow: 'hidden' }}>
                        <FileIcon width="12" height="12" style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                            paddingRight: '50px',
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
                        top: '7px',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                      }}
                    >
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        title="Rename File"
                        onClick={(e) => handleRenameClick(e, file.filename)}
                        style={{ cursor: 'pointer', height: '18px', width: '18px' }}
                      >
                        <Pencil2Icon width="10" height="10" />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        title="Delete File"
                        onClick={(e) => handleDeleteClick(e, file.filename)}
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
        <style>{`
          .file-action-buttons {
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
          }
          .file-explorer-row:hover .file-action-buttons {
            opacity: 1;
          }
          .rt-ScrollAreaViewport > div {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
        `}</style>
      </Flex>
      {isCreateOpen && (
        <CreateFileDialog
          onOpenChange={setIsCreateOpen}
          existingFiles={files.map(file => file.filename)}
          onCreate={handleCreateConfirm}
        />
      )}
      <RenameFileDialog
          key={`rename-${fileToRename}-${isRenameOpen}`}
          isOpen={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          filename={fileToRename}
          existingFiles={files.map(file => file.filename)}
          onRename={handleRenameConfirm}
      />
      <ConfirmDialog
        key={`delete-${fileToDelete}-${isDeleteOpen}`}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remove File"
        description={`Are you sure you want to remove file "${fileToDelete}"?`}
        confirmText="Remove File"
        colorVariant="red"
        onConfirm={() => handleDeleteConfirm(fileToDelete)}
      />
    </>
  );
}
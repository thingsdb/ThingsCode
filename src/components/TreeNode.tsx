import { useState } from 'react';
import { Box, Flex, Text, IconButton } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon, CubeIcon, SymbolIcon } from '@radix-ui/react-icons';
import type { ThingId, TreeNodeType } from '../types';

interface TreeNodeProps {
  nodeValue: TreeNodeType;
  label: string | number;
  registry: Record<number, TreeNodeType>;
  loadingMap: Record<number, boolean>;
  errorMap: Record<number, string | null>;
  onExpandRequest: (id: number) => Promise<void>;
  expandOninit: boolean;
}

export default function TreeNode({
  nodeValue,
  label,
  registry,
  loadingMap,
  errorMap,
  onExpandRequest,
  expandOninit,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(expandOninit);

  // { '#': 123 } or { 'id': 123 } etc.
  const isThingReference = nodeValue !== null && typeof nodeValue === 'object' && Object.keys(nodeValue).length === 1 && Number.isInteger(Object.values(nodeValue)[0]);
  const targetThingId = isThingReference ? Object.values(nodeValue as ThingId)[0] : null;

  // State...
  const isNodeCached = targetThingId !== null && registry[targetThingId] !== undefined;
  const isNodeLoading = targetThingId !== null && !!loadingMap[targetThingId];
  const nodeError = targetThingId !== null ? errorMap[targetThingId] : null;

  // Either the evaluated cached object payload, or a javascript Array
  const expandedData = targetThingId !== null ? registry[targetThingId] : nodeValue;
  const isExpandableType = expandedData !== null && typeof expandedData === 'object';

  const handleToggle = async () => {
    if (!isExpanded) {
      // Lazy fetch data
      if (targetThingId !== null && !isNodeCached) {
        await onExpandRequest(targetThingId);
      }
    }
    setIsExpanded(!isExpanded);
  };

  // Primitive values (strings, numbers, booleans, ...)
  if (!isThingReference && !isExpandableType) {
    let renderedValue = String(nodeValue);
    let tokenColor = 'var(--gray-12)';

    if (typeof nodeValue === 'string') {
      renderedValue = `"${nodeValue}"`;
      tokenColor = 'var(--green-11)';
    } else if (typeof nodeValue === 'number') {
      tokenColor = 'var(--amber-11)';
    } else if (typeof nodeValue === 'boolean') {
      tokenColor = 'var(--pink-11)';
    } else if (nodeValue === null) {
      renderedValue = 'null';
      tokenColor = 'var(--gray-8)';
    }

    return (
      <Flex align="center" gap="1" py="1" style={{ whiteSpace: 'nowrap' }}>
        <Text size="1" color="gray" weight="medium">{label}:</Text>
        <Text size="1" style={{ color: tokenColor, fontWeight: 500 }}>{renderedValue}</Text>
      </Flex>
    );
  }

  const getSummaryLabel = () => {
    if (targetThingId !== null && !isNodeCached) {
      return `#${targetThingId} {…}`;
    }
    if (Array.isArray(expandedData)) {
      return `List(${expandedData.length})`;
    }
    if (expandedData !== null && typeof expandedData === 'object') {
      return `#${targetThingId} (${Object.keys(expandedData).length} keys)`;
    }
    return 'Object?';  // Should not happen
  };

  return (
    <Box>
      {/* HEADER */}
      <Flex align="center" gap="1" py="1">
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          onClick={handleToggle}
          disabled={isNodeLoading}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        >
          {isNodeLoading ? (
            <SymbolIcon className="animate-spin" width="10" height="10" />
          ) : isExpanded ? (
            <ChevronDownIcon width="12" height="12" />
          ) : (
            <ChevronRightIcon width="12" height="12" />
          )}
        </IconButton>

        <Text size="1" color="gray" weight="medium">{label}:</Text>

        <Flex
          align="center"
          gap="1"
          className="cursor-pointer"
          onClick={handleToggle}
        >
          {isThingReference && <CubeIcon width="12" height="12" color="var(--iris-8)" />}
          <Text
            size="1"
            weight="bold"
            style={{
              color: isThingReference ? 'var(--iris-11)' : 'var(--gray-10)',
              userSelect: 'none'
            }}
          >
            {getSummaryLabel()}
          </Text>
        </Flex>

        {nodeError && (
          <Text size="1" color="red" style={{ fontStyle: 'italic', marginLeft: '8px' }}>
            ({nodeError})
          </Text>
        )}
      </Flex>

      {/* CHILDREN */}
      {isExpanded && expandedData && !isNodeLoading && !nodeError && (
        <Box
          style={{
            paddingLeft: '16px',
            borderLeft: '1px dashed var(--gray-4)',
            marginLeft: '7px',
            marginTop: '2px',
            marginBottom: '4px'
          }}
        >
          {Array.isArray(expandedData) ? (
            expandedData.length === 0 ? (
              <Text size="1" color="gray" style={{ fontStyle: 'italic', paddingLeft: '4px' }}>empty list</Text>
            ) : (
              expandedData.map((item, idx) => (
                <TreeNode
                  key={idx}
                  label={idx}
                  nodeValue={item}
                  registry={registry}
                  loadingMap={loadingMap}
                  errorMap={errorMap}
                  onExpandRequest={onExpandRequest}
                  expandOninit={false}
                />
              ))
            )
          ) : (
            Object.keys(expandedData).length === 0 ? (
              <Text size="1" color="gray" style={{ fontStyle: 'italic', paddingLeft: '4px' }}>empty object</Text>
            ) : (
              Object.entries(expandedData).map(([subKey, subVal]) => (
                <TreeNode
                  key={subKey}
                  label={subKey}
                  nodeValue={subVal}
                  registry={registry}
                  loadingMap={loadingMap}
                  errorMap={errorMap}
                  onExpandRequest={onExpandRequest}
                  expandOninit={false}
                />
              ))
            )
          )}
        </Box>
      )}
    </Box>
  );
}
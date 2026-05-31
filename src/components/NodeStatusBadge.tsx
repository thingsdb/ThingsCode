import { Badge, Flex, Tooltip } from '@radix-ui/themes';
import { useEvent } from '../hooks';

// Color map based on the active node state
const STATUS_COLOR_MAP: Record<string, 'green' | 'amber' | 'red' | 'sky'> = {
  READY: 'green',
  AWAY_SOON: 'sky',
  AWAY: 'amber',
  SHUTTING_DOWN: 'red',
};

export default function NodeStatusBadge() {
  const { nodeStatus } = useEvent();

  if (nodeStatus === null) {
    return null;
  }

  const color = nodeStatus ? STATUS_COLOR_MAP[nodeStatus.Status] || 'gray' : 'gray';

  return (
    <Flex align="center" px="1">
      <Tooltip content={`Connected Node (ID ${nodeStatus.Id}) has status ${nodeStatus.Status}`}>
        <Badge
          variant="surface"
          color={color}
          size="1"
          style={{ paddingLeft: 8, paddingRight: 8, borderRadius: 4, fontWeight: 500 }}
        >
          Node ({nodeStatus.Id}) Status: {nodeStatus.Status}
        </Badge>
      </Tooltip>
    </Flex>
  );
}
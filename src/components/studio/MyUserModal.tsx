import { useEffect, useState } from 'react';
import { useWebSocket, useActiveWorkspaceId } from '../../hooks';
import type { User } from '../../types';
import UserModal from './UserModal';

interface MyUserModalProps {
  onClose: () => void;
}

export default function MyUserModal({ onClose }: MyUserModalProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();

  const [myUser, setMyUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchMyUser= async () => {
      try {
        const response = await emit('FETCH_USER', { id: activeId }) as User;
        setMyUser(response);
      } catch (err: unknown) {
        console.error("Failed to fetch current user info:", err);
      }
    };

    queueMicrotask(fetchMyUser);
  }, [activeId, emit]);

  return myUser ? (
    <UserModal onClose={onClose} user={myUser} />
  ): null;
}
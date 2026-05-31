package main

import (
	"sync"

	"github.com/gorilla/websocket"
)

type WorkspaceManager struct {
	mu              sync.RWMutex
	workspaces      map[string]map[*websocket.Conn]struct{}
	connToWorkspace map[*websocket.Conn]string
}

func NewWorkspaceManager() *WorkspaceManager {
	return &WorkspaceManager{
		workspaces:      map[string]map[*websocket.Conn]struct{}{},
		connToWorkspace: map[*websocket.Conn]string{},
	}
}

func (wm *WorkspaceManager) Register(workspaceID string, conn *websocket.Conn) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	if oldWorkspaceID, exists := wm.connToWorkspace[conn]; exists {
		if oldWorkspaceID == workspaceID {
			return
		}
		wm.removeConnFromWorkspace(oldWorkspaceID, conn)
	}

	if _, exists := wm.workspaces[workspaceID]; !exists {
		wm.workspaces[workspaceID] = map[*websocket.Conn]struct{}{}
	}

	wm.workspaces[workspaceID][conn] = struct{}{}
	wm.connToWorkspace[conn] = workspaceID
}

func (wm *WorkspaceManager) removeConnFromWorkspace(workspaceID string, conn *websocket.Conn) {
	if conns, exists := wm.workspaces[workspaceID]; exists {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(wm.workspaces, workspaceID)
		}
	}
}

func (wm *WorkspaceManager) Unregister(conn *websocket.Conn) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	workspaceID, exists := wm.connToWorkspace[conn]
	if !exists {
		return // Connection wasn't tracked or already cleaned up
	}

	wm.removeConnFromWorkspace(workspaceID, conn)
	delete(wm.connToWorkspace, conn)
}

func (wm *WorkspaceManager) GetConnections(workspaceID string) []*websocket.Conn {
	wm.mu.RLock()
	defer wm.mu.RUnlock()

	conns, exists := wm.workspaces[workspaceID]
	if !exists || len(conns) == 0 {
		return nil
	}

	result := make([]*websocket.Conn, 0, len(conns))
	for conn := range conns {
		result = append(result, conn)
	}
	return result
}

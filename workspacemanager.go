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

func (wm *WorkspaceManager) Register(workspaceID string, wsConn *websocket.Conn) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	if oldWorkspaceID, exists := wm.connToWorkspace[wsConn]; exists {
		if oldWorkspaceID == workspaceID {
			return
		}
		wm.removeConnFromWorkspace(oldWorkspaceID, wsConn)
	}

	if _, exists := wm.workspaces[workspaceID]; !exists {
		wm.workspaces[workspaceID] = map[*websocket.Conn]struct{}{}
	}

	wm.workspaces[workspaceID][wsConn] = struct{}{}
	wm.connToWorkspace[wsConn] = workspaceID
}

func (wm *WorkspaceManager) removeConnFromWorkspace(workspaceID string, wsConn *websocket.Conn) {
	if conns, exists := wm.workspaces[workspaceID]; exists {
		delete(conns, wsConn)
		if len(conns) == 0 {
			delete(wm.workspaces, workspaceID)
		}
	}
}

func (wm *WorkspaceManager) Unregister(wsConn *websocket.Conn) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	workspaceID, exists := wm.connToWorkspace[wsConn]
	if !exists {
		return // Connection wasn't tracked or already cleaned up
	}

	wm.removeConnFromWorkspace(workspaceID, wsConn)
	delete(wm.connToWorkspace, wsConn)
}

func (wm *WorkspaceManager) GetConnections(workspaceID string) []*websocket.Conn {
	wm.mu.RLock()
	defer wm.mu.RUnlock()

	conns, exists := wm.workspaces[workspaceID]
	if !exists || len(conns) == 0 {
		return nil
	}

	result := make([]*websocket.Conn, 0, len(conns))
	for wsConn := range conns {
		result = append(result, wsConn)
	}
	return result
}

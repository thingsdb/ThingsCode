package app

import (
	"cmp"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/thingsdb/go-thingsdb"
	"github.com/vmihailenco/msgpack/v5"
)

// Settings
var currentSettings *Settings

func InitSettings(settingsFile string) {
	settings, err := loadOrCreateSettings(settingsFile)
	if err != nil {
		log.Fatal(err)
	}

	currentSettings = settings

	currentSettings.StartCleanTask()
}

func (s *Settings) Save() error {
	jsonData, err := json.MarshalIndent(s, "", "  ")

	if err != nil {
		return fmt.Errorf("failed to marshal settings: %w", err)
	}

	go func(data []byte, path string) {
		dir := filepath.Dir(path)
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("[Async] Directory creation failed: %v\n", err)
			return
		}
		if err := os.WriteFile(path, data, 0644); err != nil {
			log.Printf("[Async] Failed to write file to disk: %v\n", err)
			return
		}
	}(jsonData, s.FilePath)

	return nil
}

func (s *Settings) FetchWorkspaces() []*Workspace {
	s.mu.RLock()
	defer s.mu.RUnlock()
	decryptedList := make([]*Workspace, len(s.Workspaces))

	for i, ws := range s.Workspaces {
		username, password, token, err := ws.GetCredentials()
		if err != nil {
			log.Printf("Error decrypting: %v", err)
		}
		decryptedWs := Workspace{
			ID:             ws.ID,
			Name:           ws.Name,
			Host:           ws.Host,
			Port:           ws.Port,
			AuthType:       ws.AuthType,
			Username:       username,
			Password:       password,
			Token:          token,
			SSL:            ws.SSL,
			Workfolder:     ws.Workfolder,
			IsTmp:          ws.IsTmp,
			IsQuickConnect: ws.IsQuickConnect,
			FileScopes:     ws.FileScopes,
		}
		decryptedList[i] = &decryptedWs
	}
	return decryptedList
}

func (s *Settings) AddWorkspace(w *Workspace) (*WorkspaceRes, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w.GenerateID()
	w.LastAccess = time.Now()

	if err := w.EnsureWorkolderExists(); err != nil {
		return nil, err
	}

	switch w.AuthType {
	case AuthTypeToken:
		if err := w.SetTokenAuth(w.Token); err != nil {
			return nil, err
		}
	case AuthTypeCredentials:
		if err := w.SetUserPassAuth(w.Username, w.Password); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported authentication type: %s", w.AuthType)
	}

	s.Workspaces = append(s.Workspaces, w)

	res := WorkspaceRes{
		ID:         w.ID,
		Workfolder: w.Workfolder,
	}

	if err := s.Save(); err != nil {
		return nil, fmt.Errorf("failed to commit workspace updates to disk: %w", err)
	}
	return &res, nil
}

func (s *Settings) RemoveWorkspace(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	targetIndex := -1
	for i, w := range s.Workspaces {
		if w.ID == id {
			targetIndex = i
			break
		}
	}

	if targetIndex == -1 {
		return fmt.Errorf("workspace with ID %s not found", id)
	}

	s.Workspaces = append(s.Workspaces[:targetIndex], s.Workspaces[targetIndex+1:]...)
	return nil
}

func (s *Settings) CloseWorkspace(id string) error {
	w, err := s.getWorkspace(id)
	if err != nil {
		return err
	}

	w.LockCloseConn()

	// This will cleanup temporary stuff
	w.LastAccess = time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC)
	return nil
}

func (s *Settings) UpdateWorkspace(ws *Workspace) (*WorkspaceRes, error) {
	w, err := s.getWorkspace(ws.ID)
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if err := ws.EnsureWorkolder(); err != nil {
		return nil, err
	}

	workPath, err := ExpandHomePath(ws.Workfolder)
	if err != nil {
		return nil, err
	}

	prevWorkPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return nil, err
	}

	info, err := os.Stat(workPath)
	if os.IsNotExist(err) {
		prevInfo, err := os.Stat(prevWorkPath)
		if err == nil && prevInfo.IsDir() {
			err = os.Rename(prevWorkPath, workPath)
			if err != nil {
				return nil, fmt.Errorf("failed to rename workspace folder from %s to %s: %w", prevWorkPath, workPath, err)
			}
		} else {
			err := os.MkdirAll(workPath, 0755)
			if err != nil {
				return nil, fmt.Errorf("failed to create missing workfolder %s: %w", ws.Workfolder, err)
			}
		}
	} else if err != nil {
		return nil, fmt.Errorf("error inspecting workfolder path %s: %w", ws.Workfolder, err)
	} else if !info.IsDir() {
		return nil, fmt.Errorf("provided workfolder path %s is an existing file, not a directory", ws.Workfolder)
	}

	w.Name = ws.Name
	w.Host = ws.Host
	w.Port = ws.Port
	w.SSL = ws.SSL
	w.Workfolder = ws.Workfolder
	w.AuthType = ws.AuthType
	w.LastAccess = time.Now()

	switch ws.AuthType {
	case AuthTypeToken:
		if err := w.SetTokenAuth(ws.Token); err != nil {
			return nil, err
		}
	case AuthTypeCredentials:
		if err := w.SetUserPassAuth(ws.Username, ws.Password); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported authentication type: %s", ws.AuthType)
	}

	if err := s.Save(); err != nil {
		return nil, fmt.Errorf("failed to commit workspace updates to disk: %w", err)
	}

	res := WorkspaceRes{
		ID:         w.ID,
		Workfolder: w.Workfolder,
	}

	return &res, nil
}

func (s *Settings) FetchFiles(id string) ([]ProjectFile, error) {
	w, err := s.getWorkspace(id)
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if err := w.EnsureWorkolderExists(); err != nil {
		return nil, err
	}

	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return nil, err
	}

	if err := s.Save(); err != nil {
		return nil, fmt.Errorf("failed to commit workspace updates to disk: %w", err)
	}
	return ScanWorkspaceFiles(workPath)
}

func (s *Settings) FetchScopes(id string, wsConn *websocket.Conn) ([]string, error) {
	w, err := s.getWorkspace(id)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}
	res, err := conn.QueryRaw("/n", `{
		nodes_info: nodes_info(),
		user_info: user_info(),
	};`, nil)
	if err != nil {
		return nil, err
	}
	var data UserInfoAndNodesInfo
	if err := msgpack.Unmarshal(res, &data); err != nil {
		return nil, err
	}

	// Sort on scopes so the collection scopes are ordered
	slices.SortFunc(data.UserInfo.Access, func(a, b UserInfoAccess) int {
		return cmp.Compare(a.Scope, b.Scope)
	})

	// Node:0..X + other scopes
	scopes := make([]string, 0, len(data.NodesInfo)+len(data.UserInfo.Access)-1)
	for _, item := range data.UserInfo.Access {
		if strings.HasPrefix(item.Scope, "@thingsdb") {
			scopes = append(scopes, item.Scope)
		}
	}
	for _, item := range data.NodesInfo {
		scopes = append(scopes, fmt.Sprintf("@node:%d", item.NodeID))
	}
	for _, item := range data.UserInfo.Access {
		if strings.HasPrefix(item.Scope, "@collection") {
			scopes = append(scopes, item.Scope)
		}
	}
	return scopes, nil
}

func (s *Settings) FetchFileScopes(id string) (map[string]string, error) {
	w, err := s.getWorkspace(id)
	if err != nil {
		return nil, err
	}

	if w.FileScopes != nil {
		return w.FileScopes, nil
	}
	return map[string]string{}, nil
}

func (s *Settings) FetchRooms(id string, wsConn *websocket.Conn) ([]*Room, error) {
	w, err := s.getWorkspace(id)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}

	if w.Rooms != nil {
		for _, room := range w.Rooms {
			if room.Room == nil {
				room.Join(w.ID, conn)
			}
		}
		return w.Rooms, nil
	}
	return []*Room{}, nil
}

func (s *Settings) UpdateFileScope(u *UpdateFileScope) error {
	w, err := s.getWorkspace(u.ID)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if w.FileScopes == nil {
		w.FileScopes = map[string]string{}
	}
	w.FileScopes[u.Filename] = u.Scope
	return s.Save()
}

func (s *Settings) UpdateFileContent(u *UpdateFileContent) error {
	w, err := s.getWorkspace(u.ID)
	if err != nil {
		return err
	}
	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return err
	}
	fullPath := filepath.Join(workPath, u.Filename)
	go func(targetPath string, content string) {
		dir := filepath.Dir(targetPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("[E] Failed to create directories for path %s: %v", dir, err)
			return
		}
		// 0644 :: (owner read/write, group/others read).
		if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
			log.Printf("[E] Background auto-save failure for file %s: %v", targetPath, err)
		}
	}(fullPath, u.Content)
	return nil
}

func (s *Settings) CreateFile(u *CreateFile) error {
	w, err := s.getWorkspace(u.ID)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return err
	}

	if w.FileScopes != nil {
		delete(w.FileScopes, u.Filename) // just to make sure we start empty
	}

	go func(workPath, filename string) {
		filePath := filepath.Join(workPath, filename)

		dir := filepath.Dir(workPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("[E] Failed to create directories for path %s: %v", dir, err)
			return
		}
		// 0644 :: (owner read/write, group/others read).
		if err := os.WriteFile(filePath, []byte(""), 0644); err != nil {
			log.Printf("[E] Background create file fault %s: %v", filePath, err)
		}
	}(workPath, u.Filename)
	return s.Save()
}

func (s *Settings) RenameFile(u *RenameFile) error {
	if u.Filename == u.NewFilename {
		return nil // should not happen
	}
	w, err := s.getWorkspace(u.ID)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return err
	}

	if w.FileScopes != nil {
		if scope, found := w.FileScopes[u.Filename]; found {
			w.FileScopes[u.NewFilename] = scope
			delete(w.FileScopes, u.Filename)
		}
	}

	go func(workPath, filename, newFilename string) {
		if queryVarsPath, found := QueryVarsPath(workPath, filename); found {
			if queryVarsNewPath, found := QueryVarsPath(workPath, newFilename); found {
				_ = os.Rename(queryVarsPath, queryVarsNewPath)
			}
		}
		if resultPath, found := ResultPath(workPath, filename); found {
			if resultNewPath, found := ResultPath(workPath, newFilename); found {
				_ = os.Rename(resultPath, resultNewPath)
			}
		}
		filePath := filepath.Join(workPath, filename)
		fileNewPath := filepath.Join(workPath, newFilename)
		_ = os.Rename(filePath, fileNewPath)
	}(workPath, u.Filename, u.NewFilename)
	return s.Save()
}

func (s *Settings) DeleteFile(u *DeleteFile) error {
	w, err := s.getWorkspace(u.ID)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return err
	}

	if w.FileScopes != nil {
		delete(w.FileScopes, u.Filename)
	}

	go func(workPath, filename string) {
		if queryVarsPath, found := QueryVarsPath(workPath, filename); found {
			_ = os.Remove(queryVarsPath)
		}
		if resultPath, found := ResultPath(workPath, filename); found {
			_ = os.Remove(resultPath)
		}
		filePath := filepath.Join(workPath, filename)
		_ = os.Remove(filePath)
	}(workPath, u.Filename)
	return s.Save()
}

func (s *Settings) UpdateQueryVars(u *UpdateQueryVars) error {
	w, err := s.getWorkspace(u.ID)
	if err != nil {
		return err
	}
	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return err
	}
	if queryVarsPath, found := QueryVarsPath(workPath, u.Filename); found {
		go func(targetPath string, content string) {
			// 0644 :: (owner read/write, group/others read). (asume folder exists)
			if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
				log.Printf("[E] Failed saving execution arguments %s: %v", targetPath, err)
				return
			}
		}(queryVarsPath, u.QueryVars)
	}
	return nil
}

func (s *Settings) ExecCode(c *ExecCode, wsConn *websocket.Conn) (*Result, error) {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}
	res, err := conn.Query(c.Scope, c.Code, c.Vars)
	result := Result{
		Ts: time.Now(),
	}
	if err != nil {
		result.Error = err.Error()
	} else {
		sanitized, found := convertBinary(res)
		if found {
			result.Warning = "Warning: binary data was converted to base64"
		}
		result.Data = sanitized
	}

	dump, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}

	if workPath, err := ExpandHomePath(w.Workfolder); err == nil {
		if resultPath, found := ResultPath(workPath, c.Filename); found {
			go func(targetPath string, content []byte) {
				// 0644 :: (owner read/write, group/others read). (asume folder exists)
				if err := os.WriteFile(resultPath, dump, 0644); err != nil {
					log.Printf("[E] Failed saving result %s: %v", targetPath, err)
					return
				}
			}(resultPath, dump)
		}
	} else {
		log.Printf("[E] Failed saving result [No workPath]: %v", err)
	}

	return &result, nil
}

func (s *Settings) GetNodeInfo(c *Scope, wsConn *websocket.Conn) (*NodeInfo, error) {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}

	return GetNodeInfo(conn, c.Scope)
}

func (s *Settings) GetNodeCounters(c *Scope, wsConn *websocket.Conn) (*NodeCounters, error) {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}

	return GetNodeCounters(conn, c.Scope)
}

func (s *Settings) ResetNodeCounters(c *Scope, wsConn *websocket.Conn) error {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return err
	}

	return ResetNodeCounters(conn, c.Scope)
}

func (s *Settings) ShutdownNode(c *Scope, wsConn *websocket.Conn) error {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return err
	}

	return ShutdownNode(conn, c.Scope)
}

func (s *Settings) SetNodeLogLevel(c *SetNodeLogLevel, wsConn *websocket.Conn) error {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return err
	}

	return SetLogLevel(conn, c.Scope, c.LogLevel)
}

func (s *Settings) JoinRoom(c *JoinRoom, wsConn *websocket.Conn) (*Room, error) {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}

	room := NewRoom(c.Scope, c.Name, c.Code)
	room.Join(w.ID, conn)

	w.Rooms = append(w.Rooms, room)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.Save()
	return room, nil
}

func (s *Settings) UpdateRoom(c *JoinRoom, wsConn *websocket.Conn) (*Room, error) {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}

	for _, room := range w.Rooms {
		if room.Name == c.Name && room.Scope == c.Scope {
			if room.Room != nil {
				_ = room.Room.Leave()
				room.Room = nil
			}
			room.Id = 0
			room.ErrMsg = ""
			room.Code = c.Code
			room.Join(w.ID, conn)

			w.Rooms = append(w.Rooms, room)

			s.mu.Lock()
			defer s.mu.Unlock()
			s.Save()
			return room, nil
		}
	}
	return nil, fmt.Errorf("Room %s in scope %s not found", c.Name, c.Scope)
}

func (s *Settings) LeaveRoom(c *LeaveRoom, wsConn *websocket.Conn) error {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	for idx, room := range w.Rooms {
		if room.Name == c.Name && room.Scope == c.Scope {
			if room.Room != nil {
				_ = room.Room.Leave()
			}
			w.Rooms = slices.Delete(w.Rooms, idx, idx+1)
			break
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.Save()
	return nil
}

func (s *Settings) FetchTasks(c *Scope, wsConn *websocket.Conn) ([]Task, error) {
	w, err := s.getWorkspace(c.ID)
	if err != nil {
		return nil, err
	}
	w.mu.Lock()
	defer w.mu.Unlock()
	conn, err := s.getConn(w, wsConn)
	if err != nil {
		return nil, err
	}
	return FetchTasks(conn, c.Scope)
}

func (s *Settings) StartCleanTask() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		log.Println("ThingsCode clean up engine daemon started successfully.")
		for range ticker.C {
			s.cleanTask()
		}
	}()
}

func (s *Settings) getWorkspace(id string) (*Workspace, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	targetIndex := -1
	for i, w := range s.Workspaces {
		if w.ID == id {
			targetIndex = i
			break
		}
	}

	if targetIndex == -1 {
		return nil, fmt.Errorf("workspace with ID %s not found", id)
	}

	w := s.Workspaces[targetIndex]
	w.LastAccess = time.Now()

	return w, nil
}

func (s *Settings) getConn(ws *Workspace, wsConn *websocket.Conn) (*thingsdb.Conn, error) {
	if ws.conn != nil && ws.conn.IsConnected() {
		s.WM.Register(ws.ID, wsConn)
		return ws.conn, nil
	}
	var config *tls.Config
	if ws.SSL {
		config = &tls.Config{InsecureSkipVerify: false}
	}
	conn := thingsdb.NewConn(ws.Host, uint16(ws.Port), config)
	conn.ReconnectionAttempts = 2
	if err := conn.Connect(); err != nil {
		return nil, err
	}
	username, password, token, err := ws.GetCredentials()
	if err != nil {
		return nil, err
	}
	switch ws.AuthType {
	case AuthTypeToken:
		if err := conn.AuthToken(token); err != nil {
			conn.Close()
			return nil, err
		}
	case AuthTypeCredentials:
		if err := conn.AuthPassword(username, password); err != nil {
			conn.Close()
			return nil, err
		}
	default:
		conn.Close()
		return nil, fmt.Errorf("unsupported authentication type: %s", ws.AuthType)
	}
	ws.conn = conn

	s.registerNodeHandlers(ws.ID, conn)
	s.WM.Register(ws.ID, wsConn)

	if nodeInfo, err := GetNodeInfo(conn, "/n"); err == nil {
		ns := thingsdb.NodeStatus{
			Id:     uint32(nodeInfo.NodeID),
			Status: nodeInfo.Status,
		}
		conn.OnNodeStatus(&ns)
	} else {
		log.Printf("Got error: %v", err)
	}

	return ws.conn, nil
}

func (s *Settings) registerNodeHandlers(workspaceID string, conn *thingsdb.Conn) {
	conn.OnNodeStatus = func(ns *thingsdb.NodeStatus) {
		wsConns := s.WM.GetConnections(workspaceID)
		pkg := WSPackage{
			Type:    "ON_NODE_STATUS",
			Payload: ns,
		}
		for _, wsConn := range wsConns {
			_ = wsConn.WriteJSON(&pkg)
		}
	}
	conn.OnWarning = func(we *thingsdb.WarnEvent) {
		wsConns := s.WM.GetConnections(workspaceID)
		pkg := WSPackage{
			Type:    "ON_WARNING",
			Payload: we,
		}
		for _, wsConn := range wsConns {
			_ = wsConn.WriteJSON(&pkg)
		}
	}
}

func loadOrCreateSettings(filename string) (*Settings, error) {
	cfg := &Settings{
		FilePath: filename,
		WM:       NewWorkspaceManager(),
	}

	data, err := os.ReadFile(filename)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Printf("'%s' not found. Creating new settings file...\n", filename)
			workspace := Workspace{
				Name:       "Default ThingsDB on localhost",
				Host:       "localhost",
				Port:       9200,
				SSL:        false,
				AuthType:   AuthTypeCredentials,
				LastAccess: time.Now(),
			}
			workspace.GenerateID()

			err := workspace.SetUserPassAuth("admin", "pass")
			if err != nil {
				return cfg, err
			}

			cfg.Workspaces = []*Workspace{&workspace}
			err = cfg.Save()
			return cfg, err
		}

		// If a different file error (e.g., permission denied), bubble it up
		return cfg, fmt.Errorf("error reading configuration file (%s): %w", filename, err)
	}

	// If the file exists, parse the raw bytes
	if err := json.Unmarshal(data, cfg); err != nil {
		return cfg, fmt.Errorf("invalid JSON syntax (%s): %w", filename, err)
	}

	return cfg, nil
}

func (s *Settings) cleanTask() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	threshold := 5 * time.Minute

	var activeWorkspaces []*Workspace
	var directoriesToWipe []string

	for _, w := range s.Workspaces {
		if w.IsTmp && now.Sub(w.LastAccess) > threshold {
			log.Printf("[CleanTask] Purging expired session: %s (ID: %s)", w.Name, w.ID)
			if w.Workfolder != "" {
				directoriesToWipe = append(directoriesToWipe, w.Workfolder)
			}
			if w.IsQuickConnect {
				w.LockCloseConn()
				continue // cleanup quick connect sessions
			}
		}
		activeWorkspaces = append(activeWorkspaces, w)
	}

	if len(s.Workspaces) != len(activeWorkspaces) {
		s.Workspaces = activeWorkspaces
		_ = s.Save()
	}

	if len(directoriesToWipe) > 0 {
		go func(paths []string) {
			for _, path := range paths {
				if err := os.RemoveAll(path); err != nil {
					log.Printf("[CleanTask Warning] Failed to wipe temporary storage path %s: %v", path, err)
				}
			}
		}(directoriesToWipe)
	}
}

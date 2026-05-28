package main

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/thingsdb/go-thingsdb"
	"github.com/vmihailenco/msgpack/v5"
)

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

func (s *Settings) AddWorkSpace(w *Workspace) (*WorkSpaceRes, error) {
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

	res := WorkSpaceRes{
		ID:         w.ID,
		Workfolder: w.Workfolder,
	}

	if err := s.Save(); err != nil {
		return nil, fmt.Errorf("failed to commit workspace updates to disk: %w", err)
	}
	return &res, nil
}

func (s *Settings) RemoveWorkSpace(id string) error {
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

func (s *Settings) UpdateWorkspace(ws *Workspace) (*WorkSpaceRes, error) {
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

	res := WorkSpaceRes{
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

func (s *Settings) FetchScopes(id string) ([]string, error) {
	w, err := s.getWorkspace(id)
	if err != nil {
		return nil, err
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	conn, err := getConn(w)
	if err != nil {
		return nil, err
	}
	res, err := conn.QueryRaw("/t", "user_info();", nil)
	if err != nil {
		return nil, err
	}
	var data UserInfo
	if err := msgpack.Unmarshal(res, &data); err != nil {
		return nil, err
	}
	scopes := make([]string, 0, len(data.Access))
	for _, item := range data.Access {
		scopes = append(scopes, item.Scope)
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

func getConn(ws *Workspace) (*thingsdb.Conn, error) {
	if ws.conn != nil && ws.conn.IsConnected() {
		return ws.conn, nil
	}
	var config *tls.Config
	if ws.SSL {
		config = &tls.Config{InsecureSkipVerify: false}
	}
	conn := thingsdb.NewConn(ws.Host, uint16(ws.Port), config)
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
	return ws.conn, nil
}

func loadOrCreateSettings(filename string) (*Settings, error) {
	cfg := &Settings{
		FilePath: filename,
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

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
)

// AuthInfo
type AuthInfo struct {
	// Encrypted strings stored as Base64 in the JSON file
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	Token    string `json:"token,omitempty"`
}

// Settings matches the root JSON object wrapper structure
type Settings struct {
	mu         sync.RWMutex `json:"-"`
	FilePath   string       `json:"-"`
	Workspaces []Workspace  `json:"workspaces"`
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

func (s *Settings) FetchWorkspaces() []Workspace {
	s.mu.RLock()
	defer s.mu.RUnlock()
	decryptedList := make([]Workspace, len(s.Workspaces))

	for i, ws := range s.Workspaces {
		decryptedWs := ws
		username, password, token, err := ws.GetCredentials()
		if err == nil {
			decryptedWs.Username = username
			decryptedWs.Password = password
			decryptedWs.Token = token
		}
		decryptedList[i] = decryptedWs
	}
	return decryptedList
}

func (s *Settings) UpdateWorkspace(updated Workspace) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	targetIndex := -1
	for i, ws := range s.Workspaces {
		if ws.ID == updated.ID {
			targetIndex = i
			break
		}
	}

	if targetIndex == -1 {
		return fmt.Errorf("workspace with ID %s not found", updated.ID)
	}

	wsPtr := &s.Workspaces[targetIndex]

	wsPtr.Name = updated.Name
	wsPtr.Host = updated.Host
	wsPtr.Port = updated.Port
	wsPtr.SSL = updated.SSL
	wsPtr.Workfolder = updated.Workfolder
	wsPtr.AuthType = updated.AuthType

	switch updated.AuthType {
	case AuthTypeToken:
		if err := wsPtr.SetTokenAuth(updated.Token); err != nil {
			return err
		}
	case AuthTypeCredentials:
		if err := wsPtr.SetUserPassAuth(updated.Username, updated.Password); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unsupported authentication type: %s", updated.AuthType)
	}

	if err := s.Save(); err != nil {
		return fmt.Errorf("failed to commit workspace updates to disk: %w", err)
	}
	return nil
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
				Name:     "Default ThingsDB on localhost",
				Host:     "localhost",
				Port:     9200,
				SSL:      false,
				AuthType: AuthTypeCredentials,
			}
			workspace.GenerateID()

			err := workspace.SetUserPassAuth("admin", "pass")
			if err != nil {
				return cfg, err
			}

			cfg.Workspaces = []Workspace{workspace}

			err = cfg.Save()

			return cfg, err
		}

		// If a different file error (e.g., permission denied), bubble it up
		return cfg, fmt.Errorf("error reading configuration file: %w", err)
	}

	// If the file exists, parse the raw bytes
	if err := json.Unmarshal(data, cfg); err != nil {
		return cfg, fmt.Errorf("invalid JSON syntax format inside file: %w", err)
	}

	return cfg, nil
}

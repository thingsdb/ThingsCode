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

// Workspace matches the individual items inside the array
type Workspace struct {
	Name string `json:"name"`
}

// Settings matches the root JSON object wrapper structure
type Settings struct {
	mu         sync.RWMutex `json:"-"`
	FilePath   string       `json:"-"`
	Workspaces []Workspace  `json:"workspaces"`
}

func (s *Settings) Save() error {
	s.mu.RLock()
	jsonData, err := json.MarshalIndent(s, "", "  ")
	s.mu.RUnlock()

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

func loadOrCreateSettings(filename string) (*Settings, error) {
	cfg := &Settings{
		FilePath: filename,
	}

	data, err := os.ReadFile(filename)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Printf("'%s' not found. Creating a settings file...\n", filename)

			cfg.Workspaces = []Workspace{
				{Name: "Default Project"},
				{Name: "Sandbox Workspace"},
			}

			err := cfg.Save()
			return cfg, err
		}

		// If it's a different file error (e.g., permission denied), bubble it up
		return cfg, fmt.Errorf("error reading configuration file: %w", err)
	}

	// If the file exists, parse (Unmarshal) the raw bytes
	if err := json.Unmarshal(data, cfg); err != nil {
		return cfg, fmt.Errorf("invalid JSON syntax format inside file: %w", err)
	}

	return cfg, nil
}

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

// Workspace matches the individual items inside the array
type Workspace struct {
	Name string `json:"name"`
}

// Settings matches the root JSON object wrapper structure
type Settings struct {
	Workspaces []Workspace `json:"workspaces"`
}

func loadOrCreateSettings(filename string) (Settings, error) {
	var cfg Settings

	data, err := os.ReadFile(filename)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Printf("'%s' not found. Creating a settings file...\n", filename)

			cfg = Settings{
				Workspaces: []Workspace{
					{Name: "Default Project"},
					{Name: "Sandbox Workspace"},
				},
			}

			// Ensure the target directory path exists before writing
			dir := filepath.Dir(filename)
			if err := os.MkdirAll(dir, 0755); err != nil {
				return cfg, fmt.Errorf("failed to create directory structure: %w", err)
			}

			// Convert the struct into clean, indented human-readable JSON bytes
			jsonData, err := json.MarshalIndent(cfg, "", "  ")
			if err != nil {
				return cfg, fmt.Errorf("failed to marshal default config: %w", err)
			}

			// Write the file to disk with standard read/write permissions (0644)
			if err := os.WriteFile(filename, jsonData, 0644); err != nil {
				return cfg, fmt.Errorf("failed to save new configuration file: %w", err)
			}

			return cfg, nil
		}

		// If it's a different file error (e.g., permission denied), bubble it up
		return cfg, fmt.Errorf("error reading configuration file: %w", err)
	}

	// If the file exists, parse (Unmarshal) the raw bytes into our struct pointer
	if err := json.Unmarshal(data, &cfg); err != nil {
		return cfg, fmt.Errorf("invalid JSON syntax format inside file: %w", err)
	}

	return cfg, nil
}

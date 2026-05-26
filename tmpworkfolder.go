package main

import (
	"fmt"
	"os"
)

// TemporaryWorkspaceFolder builds a fresh sandbox workspace inside the OS temp system paths
func TemporaryWorkspaceFolder(ID string) (string, error) {
	tempDirPattern := fmt.Sprintf("ticode-%s-*", ID)

	absoluteTempPath, err := os.MkdirTemp("", tempDirPattern)
	if err != nil {
		return "", fmt.Errorf("failed to create temporary directory: %w", err)
	}

	return absoluteTempPath, nil
}

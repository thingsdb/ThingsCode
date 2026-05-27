package main

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
)



func isBinary(path string) (bool, error) {
	file, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer func() {
		_ = file.Close()
	}()


	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return false, err
	}

	sniffBuffer := buffer[:n]

	contentType := http.DetectContentType(sniffBuffer)
	if !strings.HasPrefix(contentType, "text/") && !strings.Contains(contentType, "javascript") && !strings.Contains(contentType, "json") {
		if contentType == "application/octet-stream" {
			if slices.Contains(sniffBuffer, 0x00) {
				return true, nil
			}
		} else {
			return true, nil
		}
	}
	return false, nil
}

// ScanWorkspaceFiles reads plain text files strictly at the root level (no subdirectories)
func ScanWorkspaceFiles(rootFolder string) ([]ProjectFile, error) {
	projectFiles := make([]ProjectFile, 0)

	rootFolder = filepath.Clean(rootFolder)

	entries, err := os.ReadDir(rootFolder)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		filePath := filepath.Join(rootFolder, entry.Name())

		binary, err := isBinary(filePath)
		if err != nil || binary {
			continue
		}

		contentBytes, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		projectFiles = append(projectFiles, ProjectFile{
			Filename: entry.Name(),
			Content:  string(contentBytes),
		})
	}

	return projectFiles, nil
}

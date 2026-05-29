package main

import (
	"encoding/json"
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

		projectFile := ProjectFile{
			Filename: entry.Name(),
			Content:  string(contentBytes),
		}

		if resultPath, found := ResultPath(rootFolder, entry.Name()); found {
			if resultBin, err := os.ReadFile(resultPath); err == nil && len(resultBin) > 0 {
				var result Result
				if err := json.Unmarshal(resultBin, &result); err == nil {
					projectFile.Result = &result
				}
			}
		}

		if queryVarsPath, found := QueryVarsPath(rootFolder, entry.Name()); found {
			if queryVarsBin, err := os.ReadFile(queryVarsPath); err == nil && len(queryVarsBin) > 0 {
				projectFile.QueryVars = string(queryVarsBin)
			}
		}

		projectFiles = append(projectFiles, projectFile)
	}

	return projectFiles, nil
}

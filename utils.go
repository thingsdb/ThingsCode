package main

import (
	"encoding/base64"
	"fmt"
	"os/user"
	"path/filepath"
	"strings"
)

// ExpandHomePath takes a directory string and converts any leading "~" into the absolute system home path.
func ExpandHomePath(path string) (string, error) {
	if !strings.HasPrefix(path, "~") {
		return path, nil
	}

	usr, err := user.Current()
	if err != nil {
		return "", fmt.Errorf("unable to determine system home user: %w", err)
	}

	homeDir := usr.HomeDir
	if path == "~" {
		return homeDir, nil
	}

	if strings.HasPrefix(path, "~/") {
		return strings.Replace(path, "~", homeDir, 1), nil
	}

	return "", fmt.Errorf("malformed path layout: path must be '~' or start with '~/ or not start with ~ at all'")
}

func convertBinary(v any) (any, bool) {
	var binaryFound bool

	switch val := v.(type) {
	case []byte:
		return base64.StdEncoding.EncodeToString(val), true

	case map[string]any:
		newMap := make(map[string]any)
		for k, item := range val {
			convertedItem, foundBinary := convertBinary(item)
			newMap[k] = convertedItem
			if foundBinary {
				binaryFound = true
			}
		}
		return newMap, binaryFound

	case []any:
		newSlice := make([]any, len(val))
		for i, item := range val {
			convertedItem, foundBinary := convertBinary(item)
			newSlice[i] = convertedItem
			if foundBinary {
				binaryFound = true
			}
		}
		return newSlice, binaryFound
	default:
		return v, false
	}
}

func QueryVarsPath(rootPath string, filename string) (string, bool) {
	if plainName, found := strings.CutSuffix(filename, ".ti"); found {
		queryVarsName := fmt.Sprintf(".ticode-%s-query-vars.json", plainName)
		queryVarsPath := filepath.Join(rootPath, queryVarsName)
		return queryVarsPath, true
	}
	return filename, false
}

func ResultPath(rootPath string, filename string) (string, bool) {
	if plainName, found := strings.CutSuffix(filename, ".ti"); found {
		queryVarsName := fmt.Sprintf(".ticode-%s-result.json", plainName)
		queryVarsPath := filepath.Join(rootPath, queryVarsName)
		return queryVarsPath, true
	}
	return filename, false
}

package main

import (
	"fmt"
	"os/user"
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

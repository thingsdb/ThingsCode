package main

// WorkspaceManifest holds the complete structural scan data for the frontend workspace
type WorkspaceManifest struct {
	Files  []ProjectFile `json:"files"`
	Groups []string      `json:"groups"`
}

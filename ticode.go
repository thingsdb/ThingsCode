package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

//go:embed dist
var webContent embed.FS

// Settings
var currentSettings *Settings

func main() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("Failed to detect user home directory: %v", err)
	}

	defaultSettingsPath := filepath.Join(homeDir, ".config", "ThingsCode", "settings.json")
	settingsFilePtr := flag.String("settings-file", defaultSettingsPath, "Path to the settings JSON file")
	httpPortPtr := flag.Uint("port", 6213, "Specific port for the http webserver.")

	// Parse arguments
	flag.Parse()

	settingsFile := *settingsFilePtr

	settings, err := loadOrCreateSettings(settingsFile)
	if err != nil {
		log.Fatal(err)
	}

	currentSettings = settings

	currentSettings.StartCleanTask()

	// This strips the "dist" prefix so files are served from root.
	// Without this, you'd access /dist/index.html instead of /index.html
	webFS, err := fs.Sub(webContent, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create a file server that serves from our embedded filesystem
	fileServer := http.FileServer(http.FS(webFS))

	// Serve static files at the root path
	http.Handle("/", fileServer)

	// Serve websockets
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(w, r)
	})

	log.Printf("Server starting on :%d\n", *httpPortPtr)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *httpPortPtr), nil))
}

package main

import (
	"context"
	"embed"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/thingsdb/ThingsCode/app"
	"github.com/thingsdb/ThingsCode/install"
)

//go:embed dist
var webContent embed.FS

func main() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("Failed to detect user home directory: %v", err)
	}

	defaultSettingsPath := filepath.Join(homeDir, ".config", "ThingsCode", "settings.json")
	settingsFilePtr := flag.String("settings-file", defaultSettingsPath, "Path to the settings JSON file")
	httpPortPtr := flag.Uint("port", 6213, "Specific port for the HTTP webserver")
	disableOpenBrowser := flag.Bool("disable-open-browser", false, "Disable opening ThingsCode in your default browser")
	cmdInstall := flag.Bool("install", false, "Install ThingsCode")
	cmdVersion := flag.Bool("version", false, "Print version and exit")

	// Parse arguments
	flag.Parse()

	if *cmdInstall {
		install.Install()
		os.Exit(0)
	}

	if *cmdVersion {
		fmt.Printf("ThingsCode Version %s\n", app.Version)
		os.Exit(0)
	}

	settingsFile := *settingsFilePtr

	settings := app.InitSettings(settingsFile)

	// This strips the "dist" prefix so files are served from root.
	webFS, err := fs.Sub(webContent, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create a file server that serves from our embedded filesystem
	fileServer := http.FileServer(http.FS(webFS))

	// Serve static files at the root path
	http.Handle("/", fileServer)

	// Serve WebSockets
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		app.ServeWs(w, r)
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", *httpPortPtr),
		Handler: nil,
	}
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Server starting on :%d\n", *httpPortPtr)
		if !*disableOpenBrowser {
			go func() {
				_ = app.OpenUrl(fmt.Sprintf("http://localhost:%d/", *httpPortPtr))
			}()
		}

		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Critical webserver listener crash: %v", err)
		}
	}()

	sig := <-shutdownChan
	log.Printf("Captured signal (%v). Shutdown...\n", sig)

	// Max 5 seconds to shutdown...
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced termination timeout error: %v\n", err)
	} else {
		log.Println("HTTP network listeners closed cleanly.")
	}

	settings.CleanTask(0)

	log.Println("ThingsCode successfully halted.")
}

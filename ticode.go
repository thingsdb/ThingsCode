package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed dist
var webContent embed.FS

func main() {
	var httpPort uint
	flag.UintVar(&httpPort, "port", 6213, "Specific port for the http webserver.")
	flag.Parse()

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
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(w, r)
	})
	log.Printf("Server starting on :%d\n", httpPort)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", httpPort), nil))
}

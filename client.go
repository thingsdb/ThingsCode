package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // Dev mode CORS fix
}

func writeResponse(wsConn *websocket.Conn, msg *WSMessage, payload any) error {
	response := map[string]any{
		"id":   msg.Id,
		"type": msg.Type,
		"payload": map[string]any{
			"data": payload,
		},
	}
	responseBytes, err := json.Marshal(response)
	if err != nil {
		return err
	}
	return wsConn.WriteMessage(websocket.TextMessage, responseBytes)
}

func writeError(wsConn *websocket.Conn, msg *WSMessage, err error) error {
	response := map[string]any{
		"id":   msg.Id,
		"type": msg.Type,
		"payload": map[string]any{
			"error": err.Error(),
		},
	}
	log.Printf("Error: %v", err)
	responseBytes, err := json.Marshal(response)
	if err != nil {
		return err
	}
	return wsConn.WriteMessage(websocket.TextMessage, responseBytes)
}

func serveWs(httpRespWriter http.ResponseWriter, httpRequest *http.Request) {
	wsConn, err := upgrader.Upgrade(httpRespWriter, httpRequest, nil)
	if err != nil {
		return
	}
	defer func() {
		_ = wsConn.Close()
	}()

	for {
		_, messageBytes, err := wsConn.ReadMessage()
		if err != nil {
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			continue
		}

		// ROUTE BY TYPE
		switch msg.Type {
		case "FETCH_WORKSPACES":
			_ = writeResponse(wsConn, &msg, currentSettings.FetchWorkspaces())
		case "UPDATE_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.UpdateWorkspace(&ws); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "ADD_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.AddWorkSpace(&ws); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "REMOVE_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.RemoveWorkSpace(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "CLOSE_WORKSPACE":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.CloseWorkspace(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "FETCH_FILES":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchFiles(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_SCOPES":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchScopes(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "FETCH_FILE_SCOPES":
			var ws Workspace
			if err := json.Unmarshal(msg.Payload, &ws); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.FetchFileScopes(ws.ID); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}
		case "UPDATE_FILE_SCOPE":
			var updateFileScope UpdateFileScope
			if err := json.Unmarshal(msg.Payload, &updateFileScope); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.UpdateFileScope(&updateFileScope); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "UPDATE_FILE_CONTENT":
			var updateFileContent UpdateFileContent
			if err := json.Unmarshal(msg.Payload, &updateFileContent); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.UpdateFileContent(&updateFileContent); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}

		default:
			_ = writeError(wsConn, &msg, fmt.Errorf("unknown msg Type: %s", msg.Type))
		}
	}
}

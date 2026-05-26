package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // Dev mode CORS fix
}

type WSMessage struct {
	Id      string          `json:"id,omitempty"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func writeResponse(conn *websocket.Conn, msg *WSMessage, payload any) error {
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
	return conn.WriteMessage(websocket.TextMessage, responseBytes)
}

func writeError(conn *websocket.Conn, msg *WSMessage, err error) error {
	response := map[string]any{
		"id":   msg.Id,
		"type": msg.Type,
		"payload": map[string]any{
			"error": err.Error(),
		},
	}
	responseBytes, err := json.Marshal(response)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, responseBytes)
}

func serveWs(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer func() {
		_ = conn.Close()
	}()

	for {
		_, messageBytes, err := conn.ReadMessage()
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
			_ = writeResponse(conn, &msg, currentSettings.FetchWorkspaces())
		case "UPDATE_WORKSPACE":
			var updatedWorkspace Workspace
			if err := json.Unmarshal(msg.Payload, &updatedWorkspace); err != nil {
				_ = writeError(conn, &msg, err)
				continue
			}
			if res, err := currentSettings.UpdateWorkspace(&updatedWorkspace); err != nil {
				_ = writeError(conn, &msg, err)
				continue
			} else {
				_ = writeResponse(conn, &msg, res)
			}
		case "ADD_WORKSPACE":
			var newWorkspace Workspace
			if err := json.Unmarshal(msg.Payload, &newWorkspace); err != nil {
				_ = writeError(conn, &msg, err)
				continue
			}
			if res, err := currentSettings.AddWorkSpace(&newWorkspace); err != nil {
				_ = writeError(conn, &msg, err)
				continue
			} else {
				_ = writeResponse(conn, &msg, res)
			}
		case "REMOVE_WORKSPACE":
			var removeWorkspace Workspace
			if err := json.Unmarshal(msg.Payload, &removeWorkspace); err != nil {
				_ = writeError(conn, &msg, err)
				continue
			}
			if err := currentSettings.RemoveWorkSpace(&removeWorkspace); err != nil {
				_ = writeError(conn, &msg, err)
				continue
			} else {
				_ = writeResponse(conn, &msg, "OK")
			}
		default:
			_ = writeError(conn, &msg, fmt.Errorf("unknown msg Type: %s", msg.Type))
		}
	}
}

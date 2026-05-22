package main

import (
	"encoding/json"
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
		"id":      msg.Id,
		"type":    msg.Type,
		"payload": payload,
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
				continue
			}
			if err := currentSettings.UpdateWorkspace(updatedWorkspace); err != nil {
				continue
			}
			_ = writeResponse(conn, &msg, "OK")
		case "ADD_WORKSPACE":
			var newWorkspace Workspace
			if err := json.Unmarshal(msg.Payload, &newWorkspace); err != nil {
				continue
			}
			if res, err := currentSettings.AddWorkSpace(&newWorkspace); err != nil {
				continue
			} else {
				_ = writeResponse(conn, &msg, res)
			}
		}
	}
}

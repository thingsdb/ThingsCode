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
		case "SEND_PING":
			response := map[string]interface{}{
				"id":   msg.Id,
				"type": "PING_RESPONSE",
				"payload": map[string]string{
					"response": "Bye bye!!",
				},
			}

			responseBytes, _ := json.Marshal(response)
			_ = conn.WriteMessage(websocket.TextMessage, responseBytes)
		}
	}
}

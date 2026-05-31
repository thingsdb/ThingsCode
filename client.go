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
	payloadMap := map[string]any{
		"data": payload,
	}
	pkg := WSPackage{
		Id:      msg.Id,
		Type:    msg.Type,
		Payload: payloadMap,
	}
	return wsConn.WriteJSON(&pkg)
}

func writeError(wsConn *websocket.Conn, msg *WSMessage, err error) error {
	payloadMap := map[string]any{
		"error": err.Error(),
	}
	pkg := WSPackage{
		Id:      msg.Id,
		Type:    msg.Type,
		Payload: payloadMap,
	}
	log.Printf("Error: %v", err)
	return wsConn.WriteJSON(&pkg)
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
			if res, err := currentSettings.AddWorkspace(&ws); err != nil {
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
			if err := currentSettings.RemoveWorkspace(ws.ID); err != nil {
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
			if res, err := currentSettings.FetchScopes(ws.ID, wsConn); err != nil {
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
		case "CREATE_FILE":
			var createFile CreateFile
			if err := json.Unmarshal(msg.Payload, &createFile); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.CreateFile(&createFile); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "RENAME_FILE":
			var renameFile RenameFile
			if err := json.Unmarshal(msg.Payload, &renameFile); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.RenameFile(&renameFile); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "DELETE_FILE":
			var deleteFile DeleteFile
			if err := json.Unmarshal(msg.Payload, &deleteFile); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.DeleteFile(&deleteFile); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "UPDATE_EXEC_ARGS":
			var updateQueryVars UpdateQueryVars
			if err := json.Unmarshal(msg.Payload, &updateQueryVars); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if err := currentSettings.UpdateQueryVars(&updateQueryVars); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, "OK")
			}
		case "EXEC_CODE":
			var execCode ExecCode
			if err := json.Unmarshal(msg.Payload, &execCode); err != nil {
				_ = writeError(wsConn, &msg, err)
				continue
			}
			if res, err := currentSettings.ExecCode(&execCode, wsConn); err != nil {
				_ = writeError(wsConn, &msg, err)
			} else {
				_ = writeResponse(wsConn, &msg, res)
			}

		default:
			_ = writeError(wsConn, &msg, fmt.Errorf("unknown msg Type: %s", msg.Type))
		}
	}
}

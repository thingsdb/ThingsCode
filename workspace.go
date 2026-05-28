package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
)

// Key will be generated once and stored in user profile
var theSecretKey []byte

func (a *AuthType) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	t := AuthType(s)

	switch t {
	case AuthTypeCredentials, AuthTypeToken:
		*a = t
		return nil
	default:
		return fmt.Errorf("invalid authType %q: must be 'credentials' or 'token'", s)
	}
}

func (w *Workspace) GenerateID() {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err == nil {
		w.ID = hex.EncodeToString(bytes)
	}
}

// SetUserPassAuth encrypts username/password credentials block
func (w *Workspace) SetUserPassAuth(username, password string) error {
	secretKey, err := getOrCreateSecretKey()
	if err != nil {
		return err
	}

	encUsername, err := encrypt(username, secretKey)
	if err != nil {
		return err
	}
	encPassword, err := encrypt(password, secretKey)
	if err != nil {
		return err
	}

	w.Username = encUsername
	w.Password = encPassword
	w.Token = ""

	return nil
}

// SetTokenAuth encrypts token block
func (w *Workspace) SetTokenAuth(token string) error {
	secretKey, err := getOrCreateSecretKey()
	if err != nil {
		return err
	}

	encToken, err := encrypt(token, secretKey)
	if err != nil {
		return err
	}

	w.Username = ""
	w.Password = ""
	w.Token = encToken

	return nil
}

// GetCredentials for connect to ThingsDB
func (w *Workspace) GetCredentials() (username, password, token string, err error) {
	secretKey, err := getOrCreateSecretKey()
	if err != nil {
		return
	}

	username, err = decrypt(w.Username, secretKey)
	if err != nil {
		return
	}
	password, err = decrypt(w.Password, secretKey)
	if err != nil {
		return
	}
	token, err = decrypt(w.Token, secretKey)
	return
}

func (w *Workspace) EnsureWorkolder() error {
	if w.Workfolder != "" {
		return nil
	}
	tempDir := fmt.Sprintf("ticode-%s", w.ID)
	absTempDir, err := os.MkdirTemp("", tempDir)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %w", err)
	}

	w.Workfolder = absTempDir
	return nil
}

func (w *Workspace) EncryptAuth() error {
	switch w.AuthType {
	case AuthTypeToken:
		if err := w.SetTokenAuth(w.Token); err != nil {
			return err
		}
	case AuthTypeCredentials:
		if err := w.SetUserPassAuth(w.Username, w.Password); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unsupported authentication type: %s", w.AuthType)
	}
	return nil
}

func (w *Workspace) EnsureWorkolderExists() error {
	if err := w.EnsureWorkolder(); err != nil {
		return err
	}

	workPath, err := ExpandHomePath(w.Workfolder)
	if err != nil {
		return err
	}

	info, err := os.Stat(workPath)
	if os.IsNotExist(err) {
		err := os.MkdirAll(workPath, 0755)
		if err != nil {
			return fmt.Errorf("failed to create workfolder %s: %w", w.Workfolder, err)
		}
		defaultFilePath := filepath.Join(workPath, "Untitled-0.ti")
		defaultContent := []byte("// ThingsCode IDE Engine\n\"Hello World\";\n")
		err = os.WriteFile(defaultFilePath, defaultContent, 0644)
		if err != nil {
			return fmt.Errorf("failed to create default file %s: %w", defaultFilePath, err)
		}
	} else if err != nil {
		return fmt.Errorf("error inspecting workfolder path %s: %w", w.Workfolder, err)
	} else if !info.IsDir() {
		return fmt.Errorf("provided workfolder path %s is an existing file, not a directory", w.Workfolder)
	}
	
	return nil
}

func (w *Workspace) LockCloseConn() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.conn != nil && w.conn.IsConnected() {
		w.conn.Close()
		w.conn = nil
	}
}

// Helper to encrypt plain text into a Base64 encrypted string
func encrypt(plainText string, key []byte) (string, error) {
	if plainText == "" {
		return "", nil
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Create a unique random nonce (initialization vector) for this specific encryption run
	nonce := make([]byte, aesGCM.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Seal encrypts and authenticates the text
	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plainText), nil)

	// Convert to Base64 so it can safely live inside a text JSON file
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Helper to decrypt a Base64 encrypted string back to plain text
func decrypt(cryptoText string, key []byte) (string, error) {
	if cryptoText == "" {
		return "", nil
	}

	ciphertext, err := base64.StdEncoding.DecodeString(cryptoText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	// Split out the nonce and the actual encrypted payload data split point
	nonce, actualCiphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	plainTextBytes, err := aesGCM.Open(nil, nonce, actualCiphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decryption failed (bad key or corrupted data): %w", err)
	}

	return string(plainTextBytes), nil
}

func getOrCreateSecretKey() ([]byte, error) {
	if theSecretKey != nil {
		return theSecretKey, nil
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("could not find home directory: %w", err)
	}

	keyPath := filepath.Join(homeDir, ".thingscode-key")

	key, err := os.ReadFile(keyPath)
	if err == nil {
		if len(key) != 32 {
			return nil, fmt.Errorf("stored key is invalid size (got %d bytes, want 32)", len(key))
		}
		theSecretKey = key
		return key, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		log.Println("No encryption key found. Generating a unique secret key...")

		newKey := make([]byte, 32)
		if _, err := rand.Read(newKey); err != nil {
			return nil, fmt.Errorf("failed to generate secure random bytes: %w", err)
		}

		// 0600 means: Owner can read/write. Group and World have 0 access (---)
		if err := os.WriteFile(keyPath, newKey, 0600); err != nil {
			return nil, fmt.Errorf("failed to write secure key file: %w", err)
		}

		if err := os.Chmod(keyPath, 0600); err != nil {
			return nil, fmt.Errorf("failed to strictly enforce 0600 permissions: %w", err)
		}

		theSecretKey = newKey
		return newKey, nil
	}

	// Any other unexpected file OS system errors
	return nil, err
}

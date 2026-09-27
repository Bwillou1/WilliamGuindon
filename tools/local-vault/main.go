package main

import (
	"archive/zip"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"sync"
	"time"
)

// Empreinte OpenTimestamps exacte ancrée dans la blockchain Bitcoin
const OFFICIAL_OTS_SHA256 = "3209f9ea95dfc096ebcdf1ac0288c97872206af11a6e978a74761c03b3eba4d7"
const DEFAULT_ZIP_NAME = "dossier-journalistes-tourbiere-blainville-stablex.zip"

//go:embed web/index.html
var embeddedHTML []byte

var (
	sessionToken string
	zipReader    *zip.ReadCloser
	zipMutex     sync.RWMutex
	fileCatalog  []string
	loadedPath   string
	lastError    string
	isVerified   bool
)

func generateSessionToken() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}

func findPotentialZipFiles() []string {
	var candidates []string
	home, _ := os.UserHomeDir()

	searchDirs := []string{
		".",
		filepath.Join(home, "Downloads"),
		filepath.Join(home, "Desktop"),
		filepath.Join(home, "Documents"),
	}

	for _, dir := range searchDirs {
		// Vérification directe du nom par défaut
		target := filepath.Join(dir, DEFAULT_ZIP_NAME)
		if _, err := os.Stat(target); err == nil {
			candidates = append(candidates, target)
		}

		// Recherche des fichiers contenant dossier-journalistes ou stablex
		entries, err := os.ReadDir(dir)
		if err == nil {
			for _, e := range entries {
				if !e.IsDir() && strings.HasSuffix(strings.ToLower(e.Name()), ".zip") {
					lower := strings.ToLower(e.Name())
					if strings.Contains(lower, "dossier") || strings.Contains(lower, "stablex") || strings.Contains(lower, "journaliste") {
						p := filepath.Join(dir, e.Name())
						if p != target {
							candidates = append(candidates, p)
						}
					}
				}
			}
		}
	}
	return candidates
}

func verifyAndLoadZip(filePath string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("impossible d'ouvrir le fichier ZIP : %w", err)
	}
	defer f.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, f); err != nil {
		return fmt.Errorf("erreur lors du calcul du hash SHA-256 : %w", err)
	}

	computedHash := hex.EncodeToString(hasher.Sum(nil))

	// Comparaison cryptographique en temps constant
	if subtle.ConstantTimeCompare([]byte(computedHash), []byte(OFFICIAL_OTS_SHA256)) != 1 {
		return fmt.Errorf("ÉCHEC D'INTÉGRITÉ CRYPTOGRAPHIQUE !\nEmpreinte officielle (OpenTimestamps) : %s\nEmpreinte du fichier fourni         : %s\n\nCe fichier a été modifié, corrompu ou ne provient pas de l'archive officielle.", OFFICIAL_OTS_SHA256, computedHash)
	}

	zr, err := zip.OpenReader(filePath)
	if err != nil {
		return fmt.Errorf("archive ZIP invalide ou corrompue : %w", err)
	}

	zipMutex.Lock()
	if zipReader != nil {
		zipReader.Close()
	}
	zipReader = zr

	var files []string
	prefix := "dossier-journalistes-tourbiere-blainville-stablex/"
	for _, zf := range zr.File {
		if zf.FileInfo().IsDir() {
			continue
		}
		cleanName := strings.TrimPrefix(zf.Name, prefix)
		if strings.HasPrefix(filepath.Base(cleanName), ".") || strings.HasPrefix(cleanName, "__MACOSX") {
			continue
		}
		files = append(files, cleanName)
	}
	sort.Strings(files)
	fileCatalog = files
	loadedPath = filePath
	isVerified = true
	lastError = ""
	zipMutex.Unlock()

	return nil
}

func pickNativeFile() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		cmd := exec.Command("osascript", "-e", `POSIX path of (choose file with prompt "Sélectionnez l'archive ZIP officielle SEM-26-003" of type {"zip"})`)
		out, err := cmd.Output()
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(string(out)), nil
	case "windows":
		cmd := exec.Command("powershell", "-Command", `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = "Fichiers ZIP (*.zip)|*.zip"; if($f.ShowDialog() -eq "OK"){ $f.FileName }`)
		out, err := cmd.Output()
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(string(out)), nil
	default:
		cmd := exec.Command("zenity", "--file-selection", "--file-filter=*.zip")
		out, err := cmd.Output()
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(string(out)), nil
	}
}

func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("système d'exploitation non pris en charge pour ouverture auto")
	}
	if err != nil {
		log.Printf("Impossible d'ouvrir le navigateur automatiquement : %v", err)
	}
}

func main() {
	sessionToken = generateSessionToken()

	var targetZip string
	if len(os.Args) > 1 {
		targetZip = os.Args[1]
	}

	// Tentative de chargement automatique silencieux
	if targetZip != "" {
		if err := verifyAndLoadZip(targetZip); err != nil {
			lastError = err.Error()
		}
	} else {
		for _, candidate := range findPotentialZipFiles() {
			if err := verifyAndLoadZip(candidate); err == nil {
				fmt.Printf("✅ Archive détectée et authentifiée automatiquement : %s\n", candidate)
				break
			}
		}
	}

	// Port d'écoute dynamique sur loopback 127.0.0.1
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("Impossible de démarrer l'écoute locale : %v", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleInterface)
	mux.HandleFunc("/file/", handleStreamFile)
	mux.HandleFunc("/api/catalog", handleCatalog)
	mux.HandleFunc("/api/status", handleStatus)
	mux.HandleFunc("/api/browse-native", handleBrowseNative)
	mux.HandleFunc("/api/upload-zip", handleUploadZip)

	appURL := fmt.Sprintf("http://127.0.0.1:%d/?token=%s", port, sessionToken)
	fmt.Printf("\n🚀 Interface locale active : %s\n", appURL)

	go func() {
		time.Sleep(300 * time.Millisecond)
		openBrowser(appURL)
	}()

	server := &http.Server{
		Handler:      mux,
		ReadTimeout:  120 * time.Second,
		WriteTimeout: 120 * time.Second,
	}

	if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Erreur serveur : %v", err)
	}
}

func handleInterface(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("token") != sessionToken && r.URL.Path == "/" {
		http.Error(w, "Accès non autorisé (Token de session manquant ou invalide)", http.StatusForbidden)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store, private")
	w.Write(embeddedHTML)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	zipMutex.RLock()
	defer zipMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"loaded":       isVerified,
		"verified":     isVerified,
		"hash":         OFFICIAL_OTS_SHA256,
		"file_count":   len(fileCatalog),
		"loaded_path":  loadedPath,
		"last_error":   lastError,
	})
}

func handleBrowseNative(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("token") != sessionToken {
		http.Error(w, "Accès non autorisé", http.StatusForbidden)
		return
	}
	filePath, err := pickNativeFile()
	if err != nil || filePath == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"success": false, "error": "Sélection annulée"})
		return
	}

	if err := verifyAndLoadZip(filePath); err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"success": false, "error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"success": true, "path": filePath, "count": len(fileCatalog)})
}

func handleUploadZip(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("token") != sessionToken {
		http.Error(w, "Accès non autorisé", http.StatusForbidden)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		return
	}

	// Limite de taille à 5 Go
	r.Body = http.MaxBytesReader(w, r.Body, 5<<30)
	mr, err := r.MultipartReader()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tempFile, err := os.CreateTemp("", "dossier-journalistes-*.zip")
	if err != nil {
		http.Error(w, "Impossible de créer le fichier temporaire", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if part.FormName() == "file" {
			if _, err := io.Copy(tempFile, part); err != nil {
				http.Error(w, "Erreur de téléversement", http.StatusInternalServerError)
				return
			}
			break
		}
	}

	tempFile.Sync()

	if err := verifyAndLoadZip(tempFile.Name()); err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"success": false, "error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"success": true, "count": len(fileCatalog)})
}

func handleCatalog(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("token") != sessionToken {
		http.Error(w, "Accès non autorisé", http.StatusForbidden)
		return
	}
	zipMutex.RLock()
	defer zipMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"files": fileCatalog,
		"count": len(fileCatalog),
		"hash":  OFFICIAL_OTS_SHA256,
	})
}

func handleStreamFile(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("token") != sessionToken {
		http.Error(w, "Accès non autorisé (Token de session invalide)", http.StatusForbidden)
		return
	}

	requestedPath := strings.TrimPrefix(r.URL.Path, "/file/")

	zipMutex.RLock()
	defer zipMutex.RUnlock()

	if zipReader == nil {
		http.Error(w, "Aucune archive déverrouillée", http.StatusNotFound)
		return
	}

	prefix := "dossier-journalistes-tourbiere-blainville-stablex/"

	for _, f := range zipReader.File {
		cleanName := strings.TrimPrefix(f.Name, prefix)
		if cleanName == requestedPath || f.Name == requestedPath {
			rc, err := f.Open()
			if err != nil {
				http.Error(w, "Erreur de lecture dans l'archive", http.StatusInternalServerError)
				return
			}
			defer rc.Close()

			ext := strings.ToLower(filepath.Ext(f.Name))
			switch ext {
			case ".pdf":
				w.Header().Set("Content-Type", "application/pdf")
			case ".png":
				w.Header().Set("Content-Type", "image/png")
			case ".jpg", ".jpeg":
				w.Header().Set("Content-Type", "image/jpeg")
			case ".webp":
				w.Header().Set("Content-Type", "image/webp")
			case ".csv":
				w.Header().Set("Content-Type", "text/csv; charset=utf-8")
			case ".mp4":
				w.Header().Set("Content-Type", "video/mp4")
			case ".mov":
				w.Header().Set("Content-Type", "video/quicktime")
			case ".mp3":
				w.Header().Set("Content-Type", "audio/mpeg")
			case ".wav":
				w.Header().Set("Content-Type", "audio/wav")
			default:
				w.Header().Set("Content-Type", "application/octet-stream")
			}

			w.Header().Set("Cache-Control", "no-store, private")
			io.Copy(w, rc)
			return
		}
	}

	http.NotFound(w, r)
}

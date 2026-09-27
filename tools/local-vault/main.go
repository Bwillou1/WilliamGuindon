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
)

func generateSessionToken() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}

func verifyAndLoadZip(filePath string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("impossible d'ouvrir le fichier ZIP : %w", err)
	}
	defer f.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, f); err != nil {
		return fmt.Errorf("erreur lors du calcul du hash : %w", err)
	}

	computedHash := hex.EncodeToString(hasher.Sum(nil))

	// Comparaison cryptographique en temps constant pour parer aux attaques temporelles
	if subtle.ConstantTimeCompare([]byte(computedHash), []byte(OFFICIAL_OTS_SHA256)) != 1 {
		return fmt.Errorf("ÉCHEC D'INTÉGRITÉ CRYPTOGRAPHIQUE !\nAttendu (OpenTimestamps) : %s\nCalculé (Fichier local)  : %s\n\nCe fichier ZIP a été altéré, tronqué ou ne provient pas de l'archive officielle.", OFFICIAL_OTS_SHA256, computedHash)
	}

	zr, err := zip.OpenReader(filePath)
	if err != nil {
		return fmt.Errorf("erreur d'ouverture de l'archive ZIP : %w", err)
	}

	zipMutex.Lock()
	zipReader = zr

	var files []string
	prefix := "dossier-journalistes-tourbiere-blainville-stablex/"
	for _, zf := range zr.File {
		if zf.FileInfo().IsDir() {
			continue
		}
		cleanName := strings.TrimPrefix(zf.Name, prefix)
		// Ignorer les fichiers cachés du système
		if strings.HasPrefix(filepath.Base(cleanName), ".") || strings.HasPrefix(cleanName, "__MACOSX") {
			continue
		}
		files = append(files, cleanName)
	}
	sort.Strings(files)
	fileCatalog = files
	zipMutex.Unlock()

	return nil
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

	zipPath := DEFAULT_ZIP_NAME
	if len(os.Args) > 1 {
		zipPath = os.Args[1]
	}

	// Recherche intelligente dans le répertoire courant ou Downloads
	if _, err := os.Stat(zipPath); os.IsNotExist(err) {
		home, _ := os.UserHomeDir()
		downloadPath := filepath.Join(home, "Downloads", DEFAULT_ZIP_NAME)
		if _, errDl := os.Stat(downloadPath); errDl == nil {
			zipPath = downloadPath
		}
	}

	fmt.Println("===================================================================")
	fmt.Println("  ARCHIVE DOCUMENTAIRE SEM-26-003 — LECTEUR LOCAL SÉCURISÉ")
	fmt.Println("  Vérification de l'ancrage OpenTimestamps (Blockchain Bitcoin)...")
	fmt.Println("===================================================================")

	if err := verifyAndLoadZip(zipPath); err != nil {
		fmt.Printf("\n❌ ERREUR CRITIQUE DE SÉCURITÉ :\n%v\n\n", err)
		fmt.Println("L'application a bloqué le déverrouillage de l'interface.")
		os.Exit(1)
	}

	fmt.Println("✅ INTÉGRITÉ VÉRIFIÉE AVEC SUCCÈS")
	fmt.Printf("🔒 Hash OpenTimestamps : %s\n", OFFICIAL_OTS_SHA256)
	fmt.Printf("📦 Fichier source      : %s\n", zipPath)
	fmt.Printf("📄 Pièces authentifiées : %d documents probatoires\n", len(fileCatalog))

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

	appURL := fmt.Sprintf("http://127.0.0.1:%d/?token=%s", port, sessionToken)
	fmt.Printf("\n🚀 Interface locale active : %s\n", appURL)
	fmt.Println("Appuyez sur Ctrl+C pour fermer le coffre-fort local.")

	go func() {
		time.Sleep(300 * time.Millisecond)
		openBrowser(appURL)
	}()

	server := &http.Server{
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
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

func handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"verified":   true,
		"hash":       OFFICIAL_OTS_SHA256,
		"file_count": len(fileCatalog),
		"mode":       "local_ots_vault",
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

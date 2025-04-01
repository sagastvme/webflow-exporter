package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// Opens the browser depending on the OS
func openBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	case "linux":
		cmd = "xdg-open"
		args = []string{url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default:
		fmt.Println("🔗 Please open this URL manually in your browser:", url)
		return
	}

	exec.Command(cmd, args...).Start()
}

func main() {
	const port = "8080"
	url := "http://localhost:" + port + "/html"

	// Get the current directory of the executable
	dir, err := os.Executable()
	if err != nil {
		fmt.Println("❌ Error getting executable path:", err)
		return
	}
	baseDir := filepath.Dir(dir)
	fmt.Println("📁 Serving files from:", baseDir)

	// Change to the directory of the executable
	if err := os.Chdir(baseDir); err != nil {
		fmt.Println("❌ Error changing directory:", err)
		return
	}

	// Start file server
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)

	fmt.Println("🚀 Server started at:", url)
	fmt.Println("👉 Open the browser and go to '/html' to view your exported pages.")
	openBrowser(url)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Println("❌ Server error:", err)
	}
}

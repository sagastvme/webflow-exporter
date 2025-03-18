
# Webflow Exporter

**Webflow Exporter** is a tool that exports regular websites—with a special focus on Webflow sites—by removing Webflow’s branding badge. It works with any webpage and packages your site as a zip file containing HTML, CSS, JavaScript, and image assets.

## How to Open Downloaded Files

When you export your site, you’ll receive a zip file with all the necessary assets. **Note:** Opening HTML files directly from your file system may trigger CORS errors. To view your site as intended, serve the files through a local server:

1. **Using Python’s HTTP Server:**

   Open your terminal, navigate to the directory with your exported files, and run:

   ```bash
   python -m http.server 8080
   ```

2. Open your browser and go to [http://localhost:8080](http://localhost:8080).

## Features

- **Webflow-Focused Export:** Specifically tailored to remove the Webflow badge from exported sites.
- **Universal Compatibility:** Works with any webpage, not just Webflow projects.
- **Complete Asset Packaging:** Exports a zip file containing HTML, CSS, JavaScript, and image assets.
- **Real-Time Updates:** Uses a queue system (Bull) to provide real-time status updates during the export process.
- **Express Server Powered by Bun.js:** Runs a fast, lightweight server for serving your exported files.

## Getting Started

### Prerequisites

- **Docker:** To build and run the containerized version.
- **Python:** Required only for serving HTML files locally (to bypass CORS issues).
- **Bun.js:** Integrated into the project for running the Express server (already set up if you are using the Docker image).

### How It Works

1. **Export Process:**  
   The exporter generates a zip file that includes your HTML, CSS, JavaScript, and image assets.

2. **CORS Issue Notice:**  
   Opening HTML files directly from your file system might result in CORS errors. For full functionality, serve the files through a local server as detailed above.

## Running the Project

### Using Docker

1. **Build the Image:**

   Ensure your Dockerfile uses Bun as your runtime. Then build your image with:

   ```bash
   docker compose up -d --build
   ```

### Local Development

For local development or testing without Docker, ensure you have Bun, Node.js, and Python installed. Follow the setup instructions provided in your project’s documentation.

## Technical Details

- **Queue Management:**  
  The project uses [Bull](https://github.com/OptimalBits/bull) to manage job queues, allowing the application to provide real-time updates on the export process.

- **Express Server with Bun.js:**  
  The server is powered by Bun.js, a modern JavaScript runtime, ensuring fast performance and efficient resource usage.
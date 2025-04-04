import path from 'path';
import fs from 'fs';

import { zip_output_folder } from './lib/zip_helper.js'; // <- you need to export zip_output_folder if not already

// Your other imports...
import { sseUserUpdate, addJobToQueue } from "./lib/queues/processWebsiteQueue.js";
import app from "./lib/server_settings.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Existing routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get('/job_status/:id', sseUserUpdate);
app.post("/export-webflow", addJobToQueue);

// ✅ NEW ENDPOINT
app.post("/get_zip_file", async (req, res) => {
  const { zipName } = req.body;

  if (!zipName) {
    return res.status(400).json({ error: "Missing zipName", body: req.body });
  }

  const zipPath = path.join(zip_output_folder, zipName);

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: "Zip file not found" });
  }

  res.download(zipPath, zipName, (err) => {
    if (err) {
      console.error("Error sending zip file:", err);
      res.status(500).send("Error sending file");
    } else {
      // ✅ Delete the file after it has been sent successfully
      fs.unlink(zipPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file after download:", unlinkErr);
        } else {
          console.log("Zip file deleted after download:", zipName);
        }
      });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

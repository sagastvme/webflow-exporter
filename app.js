import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import process_website from "./lib/website.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve index.html
app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// POST /export-webflow
app.post("/export-webflow", async (req, res) => {
  try {
    const { page } = req.body; // read from JSON body
    if (!page) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // 1) Call our function to get the ZIP as a buffer
    const zipBuffer = await process_website(page);

    // 2) Encode the buffer as base64
    const base64Zip = zipBuffer.toString("base64");

    // 3) Return JSON with the base64 content
    res.json({ zipFile: base64Zip });
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: "Error creating zip" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

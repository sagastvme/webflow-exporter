import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { clients, queue } from "./lib/queue.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get('/job_status/:id', (req, res) => {
  // Set headers to keep the connection alive and tell the client we're sending event-stream data
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  let jobId = req.params.id
  clients.set(jobId, res )
  req.on('close', () => {
      res.end();
  });
});

// POST /export-webflow
app.post("/export-webflow", async (req, res) => {
  try {
    const { page } = req.body; 
    if (!page) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const job =await queue.add({
      page
    })
    res.json({ jobId: job.id });
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: "Error creating zip file" });
  }
});


app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

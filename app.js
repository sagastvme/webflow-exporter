import {sseUserUpdate, addJobToQueue} from "./lib/queue.js"
import app from "./lib/server_settings.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get('/job_status/:id',sseUserUpdate);

app.post("/export-webflow", addJobToQueue);


app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

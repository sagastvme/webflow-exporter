import Bull from 'bull';
import process_website from '../website.js';




export const processWebsiteQueue = new Bull('process-website-queue', {
  redis: { host: 'redis', port: 6379 },
  settings: {
    lockDuration: 600000, //10 minutes
    maxStalledCount: 0
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    timeout: 600000
  },
});



export let clients = new Map();


processWebsiteQueue.process(async (job) => {
  try {
    const zipFile = await process_website(job);
    // Return the result to mark the job as completed
    return zipFile;
  } catch (e) {
    // Throw an error with proper message to mark the job as failed
    console.log(e)
    throw new Error(`Some unexpected error: ${e.message}`);
  }
});
// Send progress updates to SSE clients
processWebsiteQueue.on("progress", (job, progress) => {
  const client = clients.get(job.id);
  if (client) {
    client.write(`data: ${JSON.stringify({ progress })}\n\n`);
  }
});
// Event listener for completed jobs
processWebsiteQueue.on('completed', (job, result) => {
  const client = clients.get(job.id);
  if (client) {
    client.write(`data: ${JSON.stringify({ 
      status: 'completed', 
      result: result.toString('base64') 
    })}\n\n`);
    client.end();
  }
  clients.delete(job.id);
});

processWebsiteQueue.on('failed', (job, err) => {
  const client = clients.get(job.id);
  if (client) {
    client.write(`data: ${JSON.stringify({
      status: 'failed',
      error: err.message
    })}\n\n`);
    client.end();
  }
  console.log(err)
  clients.delete(job.id);
});

processWebsiteQueue.on('error', (err) => {
  console.error('Queue error:', err);
});



export async function sseUserUpdate(req, res ){
    // Set headers to keep the connection alive and tell the client we're sending event-stream data
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let jobId = req.params.id
    clients.set(jobId, res )
    req.on('close', () => {
        res.end();
    });
}

export async function addJobToQueue(req, res){
  try {
    const { webpage } = req.body; 
    if (!webpage) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const job =await processWebsiteQueue.add({
      webpage
    })
    res.json({ jobId: job.id });
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: "Error creating zip file" });
  }
}
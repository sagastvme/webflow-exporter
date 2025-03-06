import Bull from 'bull';

export const queue = new Bull('my-first-queue', {
  redis: { host: 'localhost', port: 9229 },
  defaultJobOptions: {
    removeOnComplete: true, // Automatically remove completed jobs
    removeOnFail: true,     // Automatically remove failed jobs
  },
});

import process_website from './website.js';
export let  clients = new Map();


queue.process(async (job) => {
  try {
    const zipFile = await process_website(job);
    // Return the result to mark the job as completed
    return zipFile;
  } catch (e) {
    // Throw an error with proper message to mark the job as failed
    throw new Error(`Some unexpected error: ${e.message}`);
  }
});
// Send progress updates to SSE clients
queue.on("progress", (job, progress) => {
  const client = clients.get(job.id);
  if (client) {
    client.write(`data: ${JSON.stringify({ progress })}\n\n`);
  }
  console.log(`Job ${job.id} progress: ${progress}%`);
});
// Event listener for completed jobs
queue.on('completed', (job, result) => {
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

queue.on('failed', (job, err) => {
  const client = clients.get(job.id);
  if (client) {
    client.write(`data: ${JSON.stringify({
      status: 'failed',
      error: err.message
    })}\n\n`);
    client.end();
  }
  clients.delete(job.id);
});

queue.on('error', (err) => {
  console.error('Queue error:', err);
});



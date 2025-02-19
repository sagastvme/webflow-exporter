// queue.js
import Bull from 'bull';

const queue = new Bull('my-first-queue', {
  redis: { host: 'redis', port: 6379 }
});

queue.process(async (job) => {
  let progress = 0;
  for (let i = 0; i < 10; i++) { // Simulate work in 10 steps
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated work delay
    progress += 10;
    job.progress(progress); // Update job progress
  }
  return `Processed job with data: ${JSON.stringify(job.data)}`;
});

// Event listener for completed jobs
queue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result: ${result}`);
});

// Event listener for failed jobs
queue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

export default queue;

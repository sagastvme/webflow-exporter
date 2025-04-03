import Bull from 'bull';
import { removeFolders } from '../directory.mjs';

export const removeLocalFolders = new Bull('remove-local-folders-queue', {
  redis: {
    host: 'redis',
    maxRetriesPerRequest: null,  // Reduce Redis overhead
    enableReadyCheck: false
  },
  settings: {
    drainDelay: 2,    // Faster cleanup
    guardInterval: 10 // Check stalled jobs every 10s
  },
  defaultJobOptions: {
    removeOnComplete: true,  // Auto-delete succeeded jobs
    removeOnFail: 50         // Keep only last 50 failed jobs
  }
});


removeLocalFolders.process(async (job) => {
  try {
    await removeFolders(job?.data?.paths)
    return null 
  } catch (e) {
    console.log(e)
    throw new Error(`Some unexpected error: ${e.message}`);
  }
});

// Event listener for completed jobs
removeLocalFolders.on('completed', (job, result) => {
// console.log({job, result })
console.log('remove folders completed')
});

removeLocalFolders.on('failed', (job, err) => {
 console.error('error on remove folders queue ', err )
});

removeLocalFolders.on('error', (err) => {
  console.error('Queue error:', err);
});
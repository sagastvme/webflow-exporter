import Bull from 'bull';
import { removeFolders } from '../directory.mjs';

export const removeLocalFolders = new Bull('remove-local-folders-queue', {
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
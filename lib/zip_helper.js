import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export async function zipFoldersInMemory(targetDir) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];

    // Collect data chunks to create the final zip buffer
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Try-catch for synchronous file reading
    try {
      // Add the contents of the folder (not the folder itself)
      const entries = fs.readdirSync(targetDir);

      entries.forEach((entry) => {
        const entryPath = path.join(targetDir, entry);
        if (fs.statSync(entryPath).isDirectory()) {
          archive.directory(entryPath, entry); // Preserve folder name in zip
        } else {
          archive.file(entryPath, { name: entry }); // Add file to root of zip
        }
      });

      archive.finalize(); // Finish the zip operation

    } catch (error) {
      reject(error); // Reject promise if any errors occur during reading files
    }
  });
}

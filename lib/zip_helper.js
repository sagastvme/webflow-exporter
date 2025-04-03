import archiver from 'archiver';

export async function zipFoldersInMemory(targetDir) {
  return new Promise((resolve, reject) => {
    // Use store: true to disable compression for maximum speed.
    const archive = archiver('zip', { store: true });
    const chunks = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Use archiver’s directory method to add all files/folders from targetDir recursively.
    // The second parameter "false" adds the contents directly to the zip’s root.
    archive.directory(targetDir, false);
    
    archive.finalize();
  });
}
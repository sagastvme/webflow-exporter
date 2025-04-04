import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export const zip_output_folder = './final_zips/';

export async function createZipFileLocally(targetDir) {
  return new Promise((resolve, reject) => {
    // Make sure the output folder exists
    if (!fs.existsSync(zip_output_folder)) {
      fs.mkdirSync(zip_output_folder, { recursive: true });
    }

    // Build the output zip file path
    const folderName = path.basename(targetDir);
    const zipFilePath = path.join(zip_output_folder, `${folderName}.zip`);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 }, store: false });

    // Handle stream events
    output.on('close', () => {
      console.log('created the zip file path so the zip file should be in ', zipFilePath)
      resolve(`${folderName}.zip`); // Resolve with the full path when done
    });

    output.on('error', (err) => {
      reject(err);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    try {
      const entries = fs.readdirSync(targetDir);

      entries.forEach((entry) => {
        const entryPath = path.join(targetDir, entry);
        if (fs.statSync(entryPath).isDirectory()) {
          archive.directory(entryPath, entry);
        } else {
          archive.file(entryPath, { name: entry });
        }
      });

      archive.finalize(); // Finalize the archive (important!)

    } catch (error) {
      reject(error);
    }
  });
}

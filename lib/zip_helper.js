import archiver from "archiver";
import fs from "fs";
import path from "path";


export async function zipFoldersInMemory(targetDir ) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks = [];

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    // Add the contents of the folder (not the folder itself)
    const entries = fs.readdirSync(targetDir);

    entries.forEach((entry) => {
      const entryPath = path.join(targetDir, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        archive.directory(entryPath, entry); // Preserve folder name
      } else {
        archive.file(entryPath, { name: entry }); // Add file to root of zip
      }
    });

    archive.finalize();
  });
}
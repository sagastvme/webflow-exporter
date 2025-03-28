import archiver from "archiver";
import fs from "fs";
import path from "path";


export async function zipFoldersInMemory(folderPaths) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks = [];

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    folderPaths.forEach((folderPath) => {
      if (fs.existsSync(folderPath)) {
        archive.directory(folderPath, path.basename(folderPath));
      }
    });

    archive.finalize();
  });
}

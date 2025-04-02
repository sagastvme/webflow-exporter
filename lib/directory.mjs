
import fs from 'fs';
import fsExtra from 'fs-extra'
export function makeFolders(list) {
    for (let i = 0; i < list.length; i++) {
        const path = list[i];
        if (fsExtra.existsSync(path)) {
            fsExtra.emptyDirSync(path, { recursive: true });
        } else {
            fsExtra.mkdirSync(path,{ recursive: true });
        }
    }
}
export async function removeFolders(paths) {
  try {
    // Create an array of promises for each folder removal operation
    const removalPromises = paths.map((folderPath) => {
      return fs.promises.rm(folderPath, { recursive: true, force: true });
    });

    // Wait for all removal tasks to complete
    await Promise.all(removalPromises);

    console.log('All folders have been removed successfully!');
  } catch (error) {
    console.error('Error removing folders:', error);
  }
}

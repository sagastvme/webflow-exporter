
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
  paths.forEach((path) => {
    fs.rmSync(path, { recursive: true, force: true });
  });
}

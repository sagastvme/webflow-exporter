const {
  getHtml,
  modifyScripts,
  createCss,
  removeIframes,
  modifyImages,
} = require("./lib/extract");
const path = require('path');
const { makeFolders } = require("./lib/directory");
const fatherUrl = "https://eduardos-fabulous-site-68cb8f.webflow.io/";
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const archiver = require('archiver')


let linksUsed = [];
let imagesUsed = {};

(async () => {
  try {
let tmpName = fatherUrl.replace('https://' ,'').replace('http://', '');
const last = tmpName.indexOf('.webflow');
 tmpName = tmpName.substring(0, last) + '.zip';

    const jsPath = "./scripts";
    const cssPath = "./css";
    const htmlPath = "./html";
    const imagesPath = "./images";
    const paths = [jsPath, cssPath, htmlPath, imagesPath];
    const urls = [fatherUrl];
    makeFolders(paths);
    await processWebsites(urls, jsPath, cssPath, htmlPath, imagesPath);
   await zipFolders(paths, tmpName);
    await removeFolders(paths)
  } catch (error) {
    console.error("Error:", error);
  }
})();

async function processWebsites(urls, jsPath, cssPath, htmlPath, imagesPath) {
  const extension = ".html";
  for (let i = 0; i < urls.length; i++) {
    const $ = await getHtml(urls[i]);
    await modifyScripts($, jsPath, htmlPath);
    await createCss($, cssPath);
    await modifyImages($, imagesPath, imagesUsed);
    await removeIframes($);
    const modifiedHtml = $.html(); // Get the modified HTML content
    const newName = htmlPath + "/" + uuidv4() + extension;

    fs.writeFile(newName, modifiedHtml, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        // console.log('File written successfully!');
      }
    });
    const linksFound = findLinks($, urls[i]); // Pass the individual URL to findLinks
    await processWebsites(linksFound, jsPath, cssPath, htmlPath, imagesPath); // Process the found links recursively
  }
}

function findLinks($, url) {
  let filtered = $("a").filter((index, element) => {
    let href = $(element).attr("href");
    if (href) {
      const urlToFind = fatherUrl + href.replace("/", "");
      href = href.replace("# ", "");

      if (
        href.startsWith("/") &&
        !href.startsWith("#") &&
        href !== "/" &&
        !linksUsed.includes(urlToFind)
      ) {
        linksUsed.push(urlToFind);
        return true;
      }
    }
    return false; // If href is undefined, return false
  });

  return filtered
    .map((index, element) => {
      const href = $(element).attr("href").replace("/", "");
      return fatherUrl + href;
    })
    .get()
    .filter((link, index, self) => self.indexOf(link) === index); // Filter out duplicates
}

async function zipFolders(folderPaths, zipFileName) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipFileName);
        const archive = archiver('zip', {
            zlib: { level: 9 },
        });

        archive.pipe(output);

        folderPaths.forEach(folderPath => {
            if (fs.existsSync(folderPath)) {
                const folderName = path.basename(folderPath); // Get the base folder name
                archive.directory(folderPath, folderName); // Add the folder to the archive with its original name
            } else {
                console.error(`Folder '${folderPath}' does not exist.`);
            }
        });

        archive.finalize();

        output.on('close', () => {
            console.log(`Zip file '${zipFileName}' created successfully!`);
            resolve(); // Resolve the promise when the zip creation is successful
        });

        archive.on('error', err => {
            console.error('Error creating zip file:', err);
            reject(err); // Reject the promise if there's an error
        });
    });
}


async function removeFolders(list) {
    for (let i = 0; i < list.length; i++) {
        const path = list[i];
        console.log(`Emptying directory ${path}`);
        try {
            fs.rmSync(path, { recursive: true, force: true });
        } catch (err) {
            console.error(`Error emptying directory ${path}: ${err.message}`);
        }
    }
    
    // for (let i = 0; i < list.length; i++) {
    //     const path = list[i];
    //     console.log(`Deleting directory ${path}`);
    //     try {
    //         await fsExtra.remove(path); // Delete the directory
    //     } catch (err) {
    //         console.error(`Error deleting directory ${path}: ${err.message}`);
    //     }
    // }
}

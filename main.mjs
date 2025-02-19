import {
  getHtml,
  modifyScripts,
  createCss,
  removeIframes,
  modifyImages,
} from "./lib/extract.mjs";
import path from "path";
import { makeFolders } from "./lib/directory.mjs";
import fs from "fs";
import { v4 as uuid } from "uuid";
import archiver from "archiver";
import crypto from "crypto";

const fatherUrl = "http://eduardos-fabulous-site-57049f.webflow.io/";

let linksUsed = [];
let imagesUsed = {};
// Set to store hashes of HTML contents already written
const htmlHashes = new Set();

(async () => {
  try {
    let tmpName = fatherUrl.replace("https://", "").replace("http://", "");
    const last = tmpName.indexOf(".webflow");
    tmpName = tmpName.substring(0, last) + ".zip";

    const jsPath = "./scripts";
    const cssPath = "./css";
    const htmlPath = "./html";
    const imagesPath = "./images";
    const paths = [jsPath, cssPath, htmlPath, imagesPath];
    const urls = [fatherUrl];
    makeFolders(paths);
    await processWebsites(urls, jsPath, cssPath, htmlPath, imagesPath);
    await zipFolders(paths, tmpName);
    await removeFolders(paths);
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

    // Create a SHA-256 hash of the HTML content
    const hash = crypto.createHash("sha256").update(modifiedHtml).digest("hex");

    // Check if the hash already exists
    if (htmlHashes.has(hash)) {
      console.log(`Duplicate HTML found for URL ${urls[i]}, skipping file write.`);
    } else {
      htmlHashes.add(hash);
      const newName = path.join(htmlPath, uuid() + extension);
      fs.writeFile(newName, modifiedHtml, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          // Uncomment the next line if you want confirmation on file creation.
          // console.log(`File ${newName} written successfully!`);
        }
      });
    }

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
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.pipe(output);

    folderPaths.forEach((folderPath) => {
      if (fs.existsSync(folderPath)) {
        const folderName = path.basename(folderPath); // Get the base folder name
        archive.directory(folderPath, folderName); // Add the folder to the archive with its original name
      } else {
        console.error(`Folder '${folderPath}' does not exist.`);
      }
    });

    archive.finalize();

    output.on("close", () => {
      resolve(); // Resolve the promise when the zip creation is successful
    });

    archive.on("error", (err) => {
      console.error("Error creating zip file:", err);
      reject(err); // Reject the promise if there's an error
    });
  });
}

async function removeFolders(list) {
  for (let i = 0; i < list.length; i++) {
    const folderPath = list[i];
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error emptying directory ${folderPath}: ${err.message}`);
    }
  }
}

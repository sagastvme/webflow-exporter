import {
  getHtml,
  modifyScripts,
  createCss,
  removeIframes,
  modifyImages,
} from "./extract.mjs";
import path from "path";
import { makeFolders } from "./directory.mjs";
import fs from "fs";
import { v4 as uuid } from "uuid";
import archiver from "archiver";
import crypto from "crypto";
import url from 'url'

const stringIsAValidUrl = (s) => {
  try {
    new url.URL(s);
    return true;
  } catch (err) {
    return false;
  }
};

async function process_website(fatherUrl) {

  if (!stringIsAValidUrl(fatherUrl)){
    console.log('invalid url')
    return false
  }

  const linksUsed = [];
  const contentSignatures = new Set();
  const imagesUsed = {};

  let tmpName = fatherUrl
  .replace(/^https?:\/\//, "")
  .replace(/[^\w\d_\-\.]/g, "_");

  const last = tmpName.lastIndexOf(".");
  console.log('Processing website: ', tmpName)
  tmpName = tmpName.substring(0, last) + ".zip";

  const localTmpPath = `./tmp_dir_for_websites/${tmpName.replace(".zip", "") + uuid()}`;
  const jsPath = `${localTmpPath}/scripts`;
  const cssPath = `${localTmpPath}/css`;
  const htmlPath = `${localTmpPath}/html`;
  const imagesPath = `${localTmpPath}/images`;
  const paths = [jsPath, cssPath, htmlPath, imagesPath];
  const urls = [fatherUrl];

  try {
    makeFolders(paths);
    await processWebsites(
      urls,
      jsPath,
      cssPath,
      htmlPath,
      imagesPath,
      linksUsed,
      contentSignatures,
      imagesUsed,
      fatherUrl // Pass original fatherUrl for link resolution
    );
    const zipBuffer = await zipFoldersInMemory(paths);
    await removeFolders([localTmpPath]);
    console.log('process done')
    return zipBuffer;
  } catch (error) {
    await removeFolders([localTmpPath]);
    throw error;
  }
}

async function processWebsites(
  urls,
  jsPath,
  cssPath,
  htmlPath,
  imagesPath,
  linksUsed,
  contentSignatures,
  imagesUsed,
  originalFatherUrl // Receive original base URL
) {
  const extension = ".html";

  for (const currentUrl of urls) {
    const $ = await getHtml(currentUrl);
    await modifyScripts($, jsPath, htmlPath);
    await createCss($, cssPath);
    await modifyImages($, imagesPath, imagesUsed);
    await removeIframes($);

    const modifiedHtml = $.html();
    const hash = crypto.createHash("sha256").update(modifiedHtml).digest("hex");

    if (contentSignatures.has(hash)) {
      console.log(`Skipping duplicate: ${currentUrl}`);
      continue;
    }
    contentSignatures.add(hash);

    let docTitle = $("title").text().trim() || "untitled";
    docTitle = docTitle.replace(/[^\w\d_-]/g, "_");
    const htmlFilePath = path.join(htmlPath, `${docTitle}-${uuid()}${extension}`);
    fs.writeFileSync(htmlFilePath, modifiedHtml);

    const linksFound = findLinks($, originalFatherUrl, linksUsed);
    if (linksFound.length > 0) {
      await processWebsites(
        linksFound,
        jsPath,
        cssPath,
        htmlPath,
        imagesPath,
        linksUsed,
        contentSignatures,
        imagesUsed,
        originalFatherUrl // Pass down original URL
      );
    }
  }
}

function findLinks($, baseUrl, linksUsed) {
  return $("a")
    .map((_, element) => {
      const href = $(element).attr("href")?.trim();
      if (!href || href.startsWith("#") || href === "/") return null;

      if (href.startsWith("/")) {
        const absoluteUrl = `${baseUrl}${href.replace(/^\//, "")}`;
        if (!linksUsed.includes(absoluteUrl)) {
          linksUsed.push(absoluteUrl);
          return absoluteUrl;
        }
      }
      return null;
    })
    .get()
    .filter(Boolean)
    .filter((link, index, self) => self.indexOf(link) === index);
}

async function zipFoldersInMemory(folderPaths) {
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

async function removeFolders(paths) {
  paths.forEach((path) => {
    fs.rmSync(path, { recursive: true, force: true });
  });
}

export default process_website;
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

const status_messages = {
  valid_website: "✅ Valid website detected! Let's get started with the export.",

  initial_message: "⚙️ Preparing everything for the export process. Please wait...",
  
  new_page: "🌐 Processing page: ",
  
  css: "🎨 Extracting styles and CSS to ensure the design looks perfect.",
  
  js: "🛠️ Capturing JavaScript to keep the page interactive and functional.",
  
  html: "📄 Downloading the HTML structure of the page.",
  
  images: "🖼️ Downloading all images to save them locally.",
  
  iframe: "🚫 Removing Webflow banners and unnecessary iframes.",
  
  making_folders: "📂 Creating local folders to organize the exported files.",
  
  making_zip: "📦 Compressing all files into a neat ZIP archive.",
  
  skipping_duplicate: "⏩ Skipping duplicate page to avoid redundancy.",
  
  page_locally: "💾 Saving the processed page locally for you.",
  
  removed_folders: "🧹 Cleaning up temporary folders and files. Almost done!"
};

async function process_website(job) {
  let fatherUrl = job.data.page

  if (!stringIsAValidUrl(fatherUrl)){
    console.log('invalid url')
    return false
  }
  job.progress(status_messages.valid_website)

  const linksUsed = [];
  const contentSignatures = new Set();
  const imagesUsed = {};

  let tmpName = fatherUrl
  .replace(/^https?:\/\//, "")
  .replace(/[^\w\d_\-\.]/g, "_");

  const last = tmpName.lastIndexOf(".");
  console.log('Processing website: ', tmpName)
  job.progress(status_messages.initial_message)
  tmpName = tmpName.substring(0, last) + ".zip";
job.progress(status_messages.making_folders)
  const localTmpPath = `./tmp_dir_for_websites/${tmpName.replace(".zip", "") + uuid()}`;
  const jsPath = `${localTmpPath}/scripts`;
  const cssPath = `${localTmpPath}/css`;
  const htmlPath = `${localTmpPath}/html`;
  const imagesPath = `${localTmpPath}/images`;
  const paths = [jsPath, cssPath, htmlPath, imagesPath];
  const urls = [fatherUrl];
const original = fatherUrl
  try {
    makeFolders(paths);

    await processWebsites(
      original,
      urls,
      jsPath,
      cssPath,
      htmlPath,
      imagesPath,
      linksUsed,
      contentSignatures,
      imagesUsed,
      fatherUrl, 
      job // Pass original fatherUrl for link resolution
    );
    job.progress(status_messages.making_zip)
    const zipBuffer = await zipFoldersInMemory(paths);

    
    job.progress(status_messages.removed_folders)
    await removeFolders([localTmpPath]);

    return zipBuffer;
  } catch (error) {
    await removeFolders([localTmpPath]);
    throw error;
  }
}

async function processWebsites(
  original,
  urls,
  jsPath,
  cssPath,
  htmlPath,
  imagesPath,
  linksUsed,
  contentSignatures,
  imagesUsed,
  originalFatherUrl,
  job // Receive original base URL
) {
  const extension = ".html";

  // Process each URL concurrently rather than sequentially.
  await Promise.all(urls.map(async (currentUrl) => {
    const $ = await getHtml(currentUrl);
    let modifiedHtml = $.html();
    const pathAfterDomain = new URL(currentUrl).pathname;

    let docTitle = $('html').attr('data-wf-item-slug')?.trim()
    || pathAfterDomain.replace(/\//g, '-') // fallback: convert /home/02 -> home-02
        || $("title").text().trim()
        || "untitled";
    job.progress(status_messages.new_page + docTitle)
    job.progress(status_messages.html )

    job.progress(status_messages.js)
    await modifyScripts($, jsPath, htmlPath);

    job.progress(status_messages.css)
    await createCss($, cssPath, imagesPath, imagesUsed);

    job.progress(status_messages.images)
    await modifyImages($, imagesPath, imagesUsed);
job.progress(status_messages.iframe)
    await removeIframes($);

    modifiedHtml = $.html();

    const hash = crypto.createHash("sha256").update(modifiedHtml).digest("hex");

    if (contentSignatures.has(hash)) {
      job.progress(status_messages.skipping_duplicate)
      console.log(`Skipping duplicate: ${currentUrl}`);
      return;
    }
    job.progress(status_messages.page_locally)
    contentSignatures.add(hash);

   
    docTitle = docTitle.replace(/[^\w\d_-]/g, "_");
    const htmlFilePath = path.join(htmlPath, `${docTitle}-${generateShortID()}${extension}`);
    fs.writeFileSync(htmlFilePath, modifiedHtml);

    let linksFound = findLinks($, originalFatherUrl, linksUsed);
    if (linksFound.length > 0) {
      linksFound = linksFound.filter(link => {
        try {
          // Create a new URL instance to correctly resolve relative URLs against the originalFatherUrl.
          const resolvedUrl = new URL(link, originalFatherUrl);
          return resolvedUrl.href.startsWith(originalFatherUrl);
        } catch (error) {
          // If an error occurs (invalid URL, etc.), skip this link.
          return false;
        }
      });

      await processWebsites(
        original,
        linksFound,
        jsPath,
        cssPath,
        htmlPath,
        imagesPath,
        linksUsed,
        contentSignatures,
        imagesUsed,
        originalFatherUrl,
        job // Pass down original URL
      );
    }
  }));
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

function generateShortID() {
  // Generate a random 4-character string using base36 (0-9, a-z)
  return Math.random().toString(36).substring(2, 6);
}


export default process_website;
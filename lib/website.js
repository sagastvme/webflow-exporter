import {
  getHtml,
  modifyScripts,
  createCss,
  removeIframes,
  modifyImages,
  addUserFriendlyTools,
} from "./extract.mjs";
import path from "path";
import { makeFolders, removeFolders } from "./directory.mjs";
import fs from "fs";
import crypto from "crypto";
import { status_messages } from "./status_messages.js";
import { transformUrlToCorrectFormat, stringIsAValidUrl } from "./url_helper.js";
import { generateHtmlName, generateShortID, generateZipName } from "./name_generator.js";
import { zipFoldersInMemory } from "./zip_helper.js";

async function process_website(job) {
  let userSubmittedUrl = job.data.webpage

  if (!stringIsAValidUrl(userSubmittedUrl)) {
    console.log('invalid url')
    return false
  }
  job.progress(status_messages.initial_message())
  userSubmittedUrl = transformUrlToCorrectFormat(userSubmittedUrl)
  console.log('website proceesing ', userSubmittedUrl)


  job.progress(status_messages.valid_website(userSubmittedUrl))
  job.progress(status_messages.making_folders())
  let uniqueNameForServer = generateZipName(userSubmittedUrl);
  const { paths, jsPath, cssPath, htmlPath, imagesPath, localTmpPath } = generatePathRoutes(uniqueNameForServer);
  try {
    makeFolders(paths);
   
    await processWebsites(
      userSubmittedUrl,
      jsPath,
      cssPath,
      htmlPath,
      imagesPath,
      job
    );

    job.progress(status_messages.user_friendly_tools())

    await addUserFriendlyTools(localTmpPath)

    job.progress(status_messages.making_zip())

    const zipBuffer = await zipFoldersInMemory(localTmpPath);

    
    job.progress(status_messages.removed_folders())
    await removeFolders([localTmpPath]);

    return zipBuffer;
  } catch (error) {
    await removeFolders([localTmpPath]);
    throw error;
  }
}


function generatePathRoutes(uniqueNameForServer) {
  const localTmpPath = `./tmp_dir_for_websites/${uniqueNameForServer}`;
  const jsPath = `${localTmpPath}/scripts`;
  const cssPath = `${localTmpPath}/css`;
  const htmlPath = `${localTmpPath}/html`;
  const imagesPath = `${localTmpPath}/images`;
  let paths = [jsPath, cssPath, htmlPath, imagesPath];
  return { paths, jsPath, cssPath, htmlPath, imagesPath, localTmpPath };
}

async function processWebsites(
  userSubmittedUrl,
  jsPath,
  cssPath,
  htmlPath,
  imagesPath,
  job
) {
  let first = await getHtml(userSubmittedUrl);
  const linksUsed = {};
  linksUsed[userSubmittedUrl] = generateHtmlName(first)
  let urls = [userSubmittedUrl];
  const contentSignatures = new Set();
  const imagesUsed = {};
  
  while(urls.length > 0) {
    const batchPromises = [];

    const urlBatch = urls.splice(0, 10); 
    
    for (const url of urlBatch) {
      const promise = processUrl(url, userSubmittedUrl, jsPath, cssPath, htmlPath, imagesPath, job, linksUsed, contentSignatures, imagesUsed);
      batchPromises.push(promise);
    }
    
    const results = await Promise.all(batchPromises);
    
    const newUrls = results.flat().filter(Boolean);
    urls.push(...newUrls);
  }
}
async function processUrl(url, userSubmittedUrl, jsPath, cssPath, htmlPath, imagesPath, job, linksUsed, contentSignatures, imagesUsed) {
  try {
    const $ = await getHtml(url);
    const hash = crypto.createHash("sha256").update($.html()).digest("hex");
    if (contentSignatures.has(hash)) {
      job.progress(status_messages.skipping_duplicate());
      console.log(`Skipping duplicate: ${url}`);
      return [];
    }
    contentSignatures.add(hash);

    let pathAfterDomain = new URL(url).pathname;
    job.progress(status_messages.new_page(pathAfterDomain));

    // Run script, css, and images modifications in parallel using Promise.all
    job.progress(status_messages.html());
    job.progress(status_messages.js());
    job.progress(status_messages.css());
    job.progress(status_messages.images());
    
    // Create an array of promises to execute in parallel
    const modificationPromises = [
      modifyScripts($, jsPath, htmlPath), // Modify scripts
      createCss($, cssPath, imagesPath, imagesUsed), // Create CSS
      modifyImages($, imagesPath, imagesUsed), // Modify images
      removeIframes($) // Remove iframes
    ];

    // Wait for all tasks to complete in parallel
    await Promise.all(modificationPromises);

    job.progress(status_messages.iframe());

    // Find links and generate modified HTML
    let linksFound = await findLinks($, userSubmittedUrl, linksUsed);
    let modifiedHtml = $.html();

    job.progress(status_messages.page_locally());
    pathAfterDomain = pathAfterDomain.replace(/[^\w\d_-]/g, "_");
    const htmlFilePath = path.join(htmlPath, decodeURI(linksUsed[url]));
    fs.writeFileSync(htmlFilePath, modifiedHtml);

    return linksFound;
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    return [];
  }
}




export async function findLinks($, baseUrl, linksUsed) {
  const anchors = $('a').toArray();
  const foundLinks = [];

  for (const element of anchors) {
    const href = $(element).attr('href')?.trim();
    if (!href || href.startsWith('#')) continue;

    if (href.startsWith('/')) {
      const absoluteUrl = `${baseUrl}${href.replace(/^\//, '')}`;

      if (!linksUsed[absoluteUrl]) {
        try {
          const htmlForLink = await getHtml(absoluteUrl); // returns Cheerio $
          const title = generateHtmlName(htmlForLink);     // still Cheerio $

          $(element).attr('href', title);
          linksUsed[absoluteUrl] = title;
          foundLinks.push(absoluteUrl);
        } catch (err) {
          console.error(`Error fetching ${absoluteUrl}:`, err.message);
        }
      } else {
        $(element).attr('href', linksUsed[absoluteUrl]);
      }

    }
  }

  return [...new Set(foundLinks)];
}

export default process_website;
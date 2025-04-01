import {
  getHtml,
  modifyScripts,
  createCss,
  removeIframes,
  modifyImages,
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
  userSubmittedUrl = transformUrlToCorrectFormat(userSubmittedUrl)
  console.log('website proceesing ', userSubmittedUrl)
  job.progress(status_messages.valid_website)

  const linksUsed = {};
  const contentSignatures = new Set();
  const imagesUsed = {};

  job.progress(status_messages.initial_message)
  job.progress(status_messages.making_folders)
  let uniqueNameForServer = generateZipName(userSubmittedUrl);
  const { paths, jsPath, cssPath, htmlPath, imagesPath, localTmpPath } = generatePathRoutes(uniqueNameForServer);
  const urls = [userSubmittedUrl];
  try {
    makeFolders(paths);
    let first = await getHtml(userSubmittedUrl);
    linksUsed[userSubmittedUrl] = generateHtmlName(first)
    await processWebsites(
      userSubmittedUrl,
      urls,
      jsPath,
      cssPath,
      htmlPath,
      imagesPath,
      linksUsed,
      contentSignatures,
      imagesUsed,
      job
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

function generatePathRoutes(uniqueNameForServer) {
  const localTmpPath = `./tmp_dir_for_websites/${uniqueNameForServer}`;
  const jsPath = `${localTmpPath}/scripts`;
  const cssPath = `${localTmpPath}/css`;
  const htmlPath = `${localTmpPath}/html`;
  const imagesPath = `${localTmpPath}/images`;
  const paths = [jsPath, cssPath, htmlPath, imagesPath];
  return { paths, jsPath, cssPath, htmlPath, imagesPath, localTmpPath };
}

async function processWebsites(
  userSubmittedUrl,
  urls,
  jsPath,
  cssPath,
  htmlPath,
  imagesPath,
  linksUsed,
  contentSignatures,
  imagesUsed,
  job
) {
  const extension = ".html";

  // Process each URL concurrently rather than sequentially.
  await Promise.all(urls.map(async (currentUrl) => {
    const $ = await getHtml(currentUrl);
    let modifiedHtml = $.html();
    let pathAfterDomain = new URL(currentUrl).pathname;

    job.progress(status_messages.new_page + pathAfterDomain)
    job.progress(status_messages.html)

    job.progress(status_messages.js)
    await modifyScripts($, jsPath, htmlPath);

    job.progress(status_messages.css)
    await createCss($, cssPath, imagesPath, imagesUsed);

    job.progress(status_messages.images)
    await modifyImages($, imagesPath, imagesUsed);
    job.progress(status_messages.iframe)
    await removeIframes($);
    let linksFound =await findLinks($, userSubmittedUrl, linksUsed);

    modifiedHtml = $.html();

    const hash = crypto.createHash("sha256").update(modifiedHtml).digest("hex");

    if (contentSignatures.has(hash)) {
      job.progress(status_messages.skipping_duplicate)
      console.log(`Skipping duplicate: ${currentUrl}`);
      return;
    }
    job.progress(status_messages.page_locally)
    contentSignatures.add(hash);


    pathAfterDomain = pathAfterDomain.replace(/[^\w\d_-]/g, "_");
    const htmlFilePath = path.join(htmlPath, decodeURI(linksUsed[currentUrl]));
    fs.writeFileSync(htmlFilePath, modifiedHtml);

    console.log('links found ', linksFound)
    if (linksFound.length > 0) {
      await processWebsites(
        userSubmittedUrl,
        linksFound,
        jsPath,
        cssPath,
        htmlPath,
        imagesPath,
        linksUsed,
        contentSignatures,
        imagesUsed,
        job 
      );
    }
  }));
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

      console.log('Updated link to:', $(element).attr('href'));
    }
  }

  return [...new Set(foundLinks)];
}

export default process_website;

import cheerio from 'cheerio'
import  fetch from 'node-fetch'
import { promises as fa } from 'fs';
import {v4 as uuid} from 'uuid'
import path from 'path'
import fs from 'fs'
export async function getHtml(url) {
    const website = await getWebsite(url);
    const $ = cheerio.load(website);
    return $;
}

export async function getWebsite(url) {
    const response = await fetch(url);
    const htmlContent = await response.text();
    return htmlContent;
}

export async function modifyScripts($, jsPath, html) {
  
  // Track created files so we can undo if needed
  const createdFiles = [];
  
  // Helper to remove a file if it was created
  const removeFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting file ${filePath}:`, err);
      });
    }
  };

  // Store a reference to the appended removeBadge.js script element
  let appendedBadgeScript = null;
  
  try {
    // Create the local removeBadge.js file with the provided code
    const removeBadgeFilePath = path.join(jsPath, 'removeBadge.js');
    const removeBadgeContent = `
(function() {
  // Function to remove all badges
  function removeBadge() {
    const badges = document.querySelectorAll('.w-webflow-badge');
    badges.forEach(badge => {
      if (badge.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    });
  }

  // Remove badge immediately if it exists
  removeBadge();

  // Create an observer to monitor the DOM for additions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      removeBadge();
    });
  });

  // Start observing document.body for changes in children or subtree
  observer.observe(document.body, { childList: true, subtree: true });
})();
    `;
    if (!fs.existsSync(removeBadgeFilePath)) {
      fs.writeFileSync(removeBadgeFilePath, removeBadgeContent);
      createdFiles.push(removeBadgeFilePath);
    }

    // Append the script tag to the body using Cheerio
    appendedBadgeScript = '<script src="scripts/removeBadge.js" defer></script>';
    $('body').append(appendedBadgeScript);

    // Get all script elements with a src attribute
    const scripts = $('script').filter((index, element) => $(element).attr('src') !== undefined);

    // Variable to hold the local jQuery filename once downloaded
    let localJqueryFileName = null;

    // Loop through each script element
    for (let i = 0; i < scripts.length; i++) {
      const originalSrc = $(scripts[i]).attr('src');
      // Clean the URL by removing any query parameters for filename derivation
      const cleanedSrc = originalSrc.split('?')[0];
      const fileName = cleanedSrc.split('/').pop();

      // Build the full local file path
      const localFilePath = path.join(jsPath, fileName);
      // Default new relative path
      let newRelativePath = `../scripts/${fileName}`;

      // If the script is jQuery, store its local filename for reuse
      if (/jquery/i.test(fileName)) {
        localJqueryFileName = fileName;
      }

      // For jQuery scripts, use the stored local filename if available
      if (/jquery/i.test(originalSrc) && localJqueryFileName) {
        newRelativePath = `../scripts/${localJqueryFileName}`;
      }

      // Update the src attribute in the HTML to point to the local file
      $(scripts[i]).attr('src', newRelativePath);

      // Fetch the script content from the original source
      console.log('fetching this src = ', originalSrc)
      if(originalSrc == 'scripts/removeBadge.js'){
        console.log('skipping remove badge thing ')
        continue;
      }
      const response = await fetch(originalSrc);
      if (!response.ok) {
        throw new Error(`Failed to fetch script: ${originalSrc}`);
      }
      const scriptContent = await response.text();

      // Write the script file locally if it doesn't exist already
      if (!fs.existsSync(localFilePath)) {
        fs.writeFileSync(localFilePath, scriptContent);
        createdFiles.push(localFilePath);
      }
    }
  } catch (error) {
    console.error('Error fetching or writing script:', error);
    // Undo modifications:
    // 1. Remove the appended removeBadge.js script from the DOM.
    $('script').each((index, element) => {
      if ($(element).attr('src') === 'scripts/removeBadge.js') {
        $(element).remove();
      }
    });
    // 2. Remove any files that were created.
    createdFiles.forEach(filePath => {
      removeFile(filePath);
    });
    // You can also decide whether to throw the error or handle it further.
  }
}



export async function createCss($, cssPath, imagesPath, imagesUsed) {
    const links = $('link');
    const cssFile = `${cssPath}/styling.css`;
    const relativeSrc = '../css/styling.css';
  
    // Process each <link> tag until we find a css file to download.
    for (let i = 0; i < links.length; i++) {
      let src = $(links[i]).attr('href');
      if (src && src.includes('.css')) {
        if (!fs.existsSync(cssFile)) {
          try {
            // Fetch the CSS content from the original URL
            const response = await fetch(src);
            let cssContent = await response.text();
  
            // Regex to find CSS url() declarations (handles optional quotes)
            const urlRegex = /url\((?:'|")?(.*?)(?:'|")?\)/g;
            let match;
            const downloadPromises = [];
  
            // Process each match (image URL)
            while ((match = urlRegex.exec(cssContent)) !== null) {
              const imageUrl = match[1];
  
              // Skip if the URL is a data URI or already a relative path.
              if (imageUrl.startsWith('data:') || !imageUrl.startsWith('http')) {
                continue;
              }
  
              // Function to download and replace image URL
              const downloadAndReplace = async () => {
                try {
                  // Only download if not already processed
                  if (!imagesUsed[imageUrl]) {
                    // Extract extension (handle potential query params)
                    const parts = imageUrl.split('.');
                    let extension = parts.pop().split(/[\?#]/)[0];
                    const imageResponse = await fetch(imageUrl);
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const name = generateShortID() + '.' + extension;
                    const imagePath = `${imagesPath}/${name}`;
                    const relPath = `../images/${name}`;
                    // Write the image file locally (using fs.promises or your async write)
                    await fs.promises.writeFile(imagePath, buffer);
                    imagesUsed[imageUrl] = relPath;
                  }
                  // Replace all occurrences of the original image URL in the CSS with the new relative path.
                  cssContent = cssContent.split(imageUrl).join(imagesUsed[imageUrl]);
                } catch (e) {
                  console.error('Error downloading image:', imageUrl, e);
                }
              };
  
              downloadPromises.push(downloadAndReplace());
            }
  
            // Wait for all images to be processed
            await Promise.all(downloadPromises);
  
            // Write the modified CSS content locally.
            await fs.promises.writeFile(cssFile, cssContent);
            // Update the link element to point to the local CSS file
            $(links[i]).attr('href', relativeSrc);
            break; // exit after processing the first css link
          } catch (error) {
            console.error('Error fetching or writing CSS:', error);
          }
        } else {
          // CSS file already exists; update the link to use the local relative path.
          $(links[i]).attr('href', relativeSrc);
        }
      }
    }
  }
export async function removeIframes($) {
    const iframes = $('iframe');
    iframes.each(async (index, element) => {
        await $(element).remove();
    });
}

export async function modifyImages($, imagesPath, imagesUsed) {
    let images = $('img');
    images = images.filter((index, element) => {
        return $(element).attr('src') !== undefined;
    });

    for (let i = 0; i < images.length; i++) {
        const src = $(images[i]).attr('src');

        try {
            const extension = src.split('.').pop();
            const content = await fetch(src);
            const arrayBuffer = await content.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const name = generateShortID() + '.' + extension
            const path = imagesPath + '/' + name
            
            let relPath =  '../images/' + name  
            if (!imagesUsed[src]) {
                imagesUsed[src] = relPath
                try{
                    await fa.writeFile(path, buffer);
                }catch(e){
                    console.error(e)
                }
            } else {
                relPath = imagesUsed[src]
            }
            $(images[i]).attr('src', relPath);
            $(images[i]).removeAttr('srcset');
        } catch (err) {
        }
    }
    return null;
}

function generateShortID() {
  // Generate a random 4-character string using base36 (0-9, a-z)
  return Math.random().toString(36).substring(2, 6);
}

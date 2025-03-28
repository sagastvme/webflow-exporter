
import cheerio from 'cheerio'
import  fetch from 'node-fetch'
import { promises as fa } from 'fs';
import path from 'path'
import fs from 'fs'
import { generateShortID } from './name_generator.js';




export async function getHtml(url) {
    const website = await fetchWebsiteContent(url);
    const $ = cheerio.load(website);
    return $;
}

export async function fetchWebsiteContent(url) {
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
    const serverRemoveBadgePath = './lib/removeBadge.js'
    const zipRemoveBadgePath = path.join(jsPath, 'removeBadge.js');
    if (!fs.existsSync(zipRemoveBadgePath)) {
    await fs.promises.copyFile(serverRemoveBadgePath, zipRemoveBadgePath);
      createdFiles.push(zipRemoveBadgePath);
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
      if(originalSrc == 'scripts/removeBadge.js'){
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
  
    for (let i = 0; i < links.length; i++) {
      let src = $(links[i]).attr('href');
      if (src && src.includes('.css')) {
        if (!fs.existsSync(cssFile)) {
          try {
            const response = await fetch(src);
            let cssContent = await response.text();
  
            const urlRegex = /url\((?:'|")?(.*?)(?:'|")?\)/g;
            let match;
            const downloadPromises = [];
  
            while ((match = urlRegex.exec(cssContent)) !== null) {
              const imageUrl = match[1];
  
            // Skip data URIs and non-http URLs
              if (imageUrl.startsWith('data:') || !imageUrl.startsWith('http')) {
                continue;
              }
  
              const downloadAndReplace = async () => {
                try {
                  if (!imagesUsed[imageUrl]) {
                  // Skip incomplete or invalid image URLs (no valid extension)
                  if (!/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|eot)(\?|#|$)/i.test(imageUrl)) {
                    console.warn('Skipping invalid or incomplete image URL:', imageUrl);
                    return;
                  }

                  // Sanitize file name
                  const originalFileName = imageUrl.split('/').pop().split(/[\?#]/)[0];
                  const cleanFileName = originalFileName.replace(/[^\w.-]/g, '_');

                  const name = generateShortID() + '_' + cleanFileName;
                  const imagePath = `${imagesPath}/${name}`;
                  const relPath = `../images/${name}`;

                    const imageResponse = await fetch(imageUrl);
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    await fs.promises.writeFile(imagePath, buffer);
                    imagesUsed[imageUrl] = relPath;
                  }

                  cssContent = cssContent.split(imageUrl).join(imagesUsed[imageUrl]);
                } catch (e) {
                console.error('Error downloading image:', imageUrl, e.message);
                }
              };
  
              downloadPromises.push(downloadAndReplace());
            }
  
            await Promise.all(downloadPromises);
  
            await fs.promises.writeFile(cssFile, cssContent);
          $(links[i]).attr('href', relativeSrc);
          break; // Stop after first CSS processed
        } catch (error) {
          console.error('Error fetching or writing CSS:', error.message);
        }
      } else {
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

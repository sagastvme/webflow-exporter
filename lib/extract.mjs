
import cheerio from 'cheerio'
import  fetch from 'node-fetch'
import { promises as fa } from 'fs';
import {v4 as uuid} from 'uuid'

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
    let scripts = $('script');
    scripts = scripts.filter((index, element) => {
        return $(element).attr('src') !== undefined;
    });
    const jsFile = `${jsPath}/interactivity.js`
    const relativeSrc = '../scripts/interactivity.js'
    for (let i = 0; i < scripts.length; i++) {
        const src = $(scripts[i]).attr('src');
        if (src.includes('js/webflow')) {
            if (!fs.existsSync(jsFile)) {
                try {
                    const response = await fetch(src); // Fetch the script content
                    const scriptContent = (await response.text()).replace('brandElement = brandElement || createBadge();', ''); // Get the text content of the script
                    $(scripts[i]).attr('src', relativeSrc)
                    fs.writeFile(jsFile, scriptContent, (err) => {
                        if (err) console.error(err)
                    });
                } catch (error) {
                    console.error('Error fetching or writing script:', error);
                }
            } else {
                $(scripts[i]).attr('src', relativeSrc)

            }
        }
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
                    const name = uuid() + '.' + extension;
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
            const name = uuid() + '.' + extension
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


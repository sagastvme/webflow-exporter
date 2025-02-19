
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

export async function createCss($, cssPath) {
    const links = $('link');
    const cssFile = `${cssPath}/styling.css`;
    const relativeSrc = '../css/styling.css'
    for (let i = 0; i < links.length; i++) {
        let src = $(links[i]).attr('href');
        if (src && src.includes('.css')) {
            if (!fs.existsSync(cssFile)) {
                try {
                    const response = await fetch(src); // Fetch the script content
                    const scriptContent = (await response.text());
                    $(links[i]).attr('href', relativeSrc)
                    fs.writeFile(cssFile, scriptContent, (err) => {
                        if (err) console.error(err)
                    });
                    break
                } catch (error) {
                    console.error('Error fetching or writing script:', error);
                }
            } else {
                $(links[i]).attr('href', relativeSrc)
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
            // const path = imagesPath + '/' + name
            const path =   '../images/' + name

            let relPath = '.' + path
            if (!imagesUsed[src]) {
                imagesUsed[src] = relPath
                await fa.writeFile(path, buffer);
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


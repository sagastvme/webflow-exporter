const cheerio = require("cheerio");
const fetch = require("node-fetch");
const fs = require('fs')
const fa = require('fs').promises
const {v4: uuidv4} = require('uuid');

async function getHtml(url) {
    const website = await getWebsite(url);
    const $ = cheerio.load(website);
    return $;
}

async function getWebsite(url) {
    const response = await fetch(url);
    const htmlContent = await response.text();
    return htmlContent;
}

async function modifyScripts($, jsPath, html) {
    let scripts = $('script');
    scripts = scripts.filter((index, element) => {
        return $(element).attr('src') !== undefined;
    });
    const jsFile = './scripts/interactivy.js'
    const relativeSrc = '.' + jsFile
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

async function createCss($, cssPath) {
    const links = $('link');
    const cssFile = './css/styling.css';
    const relativeSrc = '.' + cssFile
    for (let i = 0; i < links.length; i++) {
        let src = $(links[i]).attr('href');
        if (src.includes('.css')) {
            if (!fs.existsSync(cssFile)) {
                try {
                    const response = await fetch(src); // Fetch the script content
                    const scriptContent = (await response.text());
                    $(links[i]).attr('href', relativeSrc)
                    fs.writeFile(cssFile, scriptContent, (err) => {
                        if (err) console.error(err)
                    });
                } catch (error) {
                    console.error('Error fetching or writing script:', error);
                }
            } else {
                $(links[i]).attr('href', relativeSrc)
            }
            // }
            // try {

            // } catch (error) {
            //     console.error('Error fetching or writing CSS:', error);
            // }
        }
    }
}

async function removeIframes($) {
    const iframes = $('iframe');
    iframes.each(async (index, element) => {
        await $(element).remove();
    });
}

async function modifyImages($, imagesPath, imagesUsed) {
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
            const name = uuidv4() + '.' + extension
            const path = imagesPath + '/' + name
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


module.exports = {getHtml, modifyScripts, removeIframes, createCss, modifyImages};

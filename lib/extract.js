const cheerio = require("cheerio");
const fetch = require("node-fetch");
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');
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

async function modifyScripts($, jsPath) {
    let scripts = $('script');
    scripts = scripts.filter((index, element) => {
        return $(element).attr('src') !== undefined;
    });
    for (let i = 0; i < scripts.length; i++) {
        const src = $(scripts[i]).attr('src');
        console.log(src)
        if (src.includes('js/webflow')) {
            try {
                const response = await fetch(src); // Fetch the script content
                const scriptContent = (await response.text()).replace( 'brandElement = brandElement || createBadge();',''); // Get the text content of the script
                const newName = uuidv4() + '.js';
                const newPath = jsPath + '/' + newName
                $(scripts[i]).attr('src', newPath)
                fs.writeFile(newPath, scriptContent, (err) => {
                    if (err) console.error(err)
                });
            } catch (error) {
                console.error('Error fetching or writing script:', error);
            }
        }
    }
}


async function removeIframes($) {
    const iframes = $('iframe');
    iframes.each(async (index, element) => {
        await $(element).remove();
    });
}

async function createCss($, cssPath) {
    const links = $('link');
    for (let i = 0; i < links.length; i++) {
        let src = $(links[i]).attr('href');
        if (src.includes('.css')) {
            try {
                const response = await fetch(src);
                const cssContent = await response.text();
                const newName = uuidv4() + '.css';
                const newPath = cssPath + '/' + newName;
                $(links[i]).attr('href', newPath);
                fs.writeFile(newPath, cssContent, (err) => {
                    if (err) console.error(err);
                });
            } catch (error) {
                console.error('Error fetching or writing CSS:', error);
            }
        }
    }
}





module.exports = { getHtml,modifyScripts,removeIframes,createCss };

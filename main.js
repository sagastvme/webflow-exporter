const { getHtml,modifyScripts ,createCss,removeIframes} = require('./lib/extract');
const { makeFolders} = require('./lib/directory');
const fatherUrl = "https://eduardos-fabulous-site-68cb8f.webflow.io/";
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let linksUsed=[];



(async () => {
    try {
        const jsPath = './scripts';
        const cssPath = './css';
        const htmlPath = './html'
        const paths = [jsPath, cssPath, htmlPath];
        const urls = [fatherUrl];
        makeFolders(paths);
        await processWebsites(urls, jsPath, cssPath, htmlPath)

    } catch (error) {
        console.error('Error:', error);
    }
})();

async function processWebsites(urls, jsPath, cssPath,htmlPath) {
    const extension = '.html';
    for (let i = 0; i < urls.length; i++) {
        const $ = await getHtml(urls[i]);
        await modifyScripts($, jsPath, htmlPath);
        await createCss($, cssPath);
        await removeIframes($);
        const modifiedHtml = $.html(); // Get the modified HTML content
        const newName = htmlPath + '/'+ uuidv4() + extension;

        fs.writeFile(newName, modifiedHtml, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('File written successfully!');
            }
        });
        const linksFound = findLinks($, urls[i]); // Pass the individual URL to findLinks
        // Push the individual URL into linksUsed
        await processWebsites(linksFound, jsPath, cssPath,htmlPath); // Process the found links recursively
    }
}



function findLinks($, url) {
    let filtered = $('a').filter((index, element) => {
        let href = $(element).attr('href');
        if (href) {
            const urlToFind = fatherUrl + href.replace('/', '');
            href = href.replace('# ', '')
            
            if(href.startsWith('/') && !href.startsWith('#') && href !== '/' && !linksUsed.includes(urlToFind)){
                linksUsed.push(urlToFind);
                return true
            }
        }
        return false; // If href is undefined, return false
    });

    return filtered.map((index, element) => {
        const href = $(element).attr('href').replace('/', '');
        return fatherUrl + href;
    }).get()
    .filter((link, index, self) => self.indexOf(link) === index); // Filter out duplicates
}


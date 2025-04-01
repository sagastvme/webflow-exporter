
export function generateShortID() {
  // Generate a random 4-character string using base36 (0-9, a-z)
  return Math.random().toString(36).substring(2, 6);
} 


export function generateHtmlName(input, extension = '.html') {
  const $ = typeof input === 'function' ? input : cheerio.load(input); // soporta string o cheerio

  const htmlElement = $('html').get(0);
  let title = $(htmlElement).attr('data-wf-item-slug')?.trim();

  if (!title) {
    title = $('h1').first().text().trim() ||
            $('meta[name="description"]').attr('content')?.trim() ||
            $('title').text().trim() ||
            'untitled';
  }

  title = title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  return `${title}-${generateShortID()}${extension}`;
}


export function generateZipName(userSubmittedUrl) {
  let uniqueNameForServer = userSubmittedUrl
    .replace(/^https?:\/\//, "")
    .replace(/[^\w\d_\-\.]/g, "_");

  const last = uniqueNameForServer.lastIndexOf(".");
  console.log('Processing website: ', uniqueNameForServer);
  uniqueNameForServer = uniqueNameForServer.substring(0, last);
  return uniqueNameForServer + generateShortID();
}


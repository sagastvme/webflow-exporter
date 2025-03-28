
export function generateShortID() {
  // Generate a random 4-character string using base36 (0-9, a-z)
  return Math.random().toString(36).substring(2, 6);
} 


export function generateHtmlName($, extension = '.html') {
  let title = ($('html').attr('data-wf-item-slug')?.trim()) ||
    $("title").text().trim() ||
    "untitled";

  title += '-' + generateShortID();
  title = encodeURI(title);
  title += extension;
  return title;
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


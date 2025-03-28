import url from "url";


export const stringIsAValidUrl = (s) => {
  try {
    new url.URL(s);
    return true;
  } catch (err) {
    return false;
  }
};export function transformUrlToCorrectFormat(url) {
  if (!url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (!url.endsWith('/')) {
    url += '/';
  }
  return url;
}


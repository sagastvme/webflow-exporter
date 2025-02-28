# 🌐 Webflow Website Downloader

## 🤔 What is the Project?

A Node.js tool for downloading Webflow websites locally.
Captures HTML, CSS, JavaScript, and images for offline use.

## ❓ Why Does it Exist?

Creates backups, enables offline development, and facilitates website migration.
Allows for local performance analysis and testing.

## 🛠️ Tools Used and Why

Node.js for asynchronous operations.
Cheerio for HTML parsing, Archiver for ZIP creation, UUID for unique filenames.
fs-extra for file operations, node-fetch for downloading resources.

## 💾 How to Install

1. Clone the repository.
2. Navigate to the project directory.
3. Run `npm install` to install dependencies.

## 🚀 How to Use It

1. Set the `fatherUrl` in `main.mjs` to your Webflow site's URL.
2. Run `node main.mjs`.
3. Find the ZIP file with your downloaded website in the project directory.

## 🤝 How to Contribute

Report issues and submit pull requests on GitHub.
Suggest improvements and help with code review or documentation.

## ⚠️ Remember to respect website terms of service when using this tool.






# Benchmarks

### Website Processed:
[Eduardo's Fabulous Site](https://eduardos-fabulous-site-68cb8f.webflow.io/)

### Execution Times:
- **Node.js:** ⏱️ 137,353.58 ms  
- **Bun:** ⏱️ 45,755.32 ms  

### Performance Comparison:
🚀 **Bun is** _1 minute and 30 seconds faster_ than Node.js!

# Benchmarks

### Website Processed:
[Eduardo's Fabulous Site](http://eduardos-fabulous-site-57049f.webflow.io/)

### Execution Times:
- **Node.js:** ⏱️ 84388.82 ms
- **Bun:** ⏱️ 30451.21 ms

### Performance Comparison:
🚀 **Bun is** _50 seconds faster_ than Node.js!


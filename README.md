# 🌐 Webflow Website Downloader

This tool allows you to download a Webflow website, including all CSS, HTML, JS, and images.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it [here](https://nodejs.org/en/download/package-manager).

## How to Use This Tool

1. **Install Dependencies**:
    - Open the command line/terminal in the project's root folder.
    - Run the following command to install all the dependencies:
      ```sh
      npm install
      ```

2. **Configure the URL**:
    - Open the file `main.mjs`.
    - Locate the variable named `fatherUrl`.
    - Replace the placeholder value with the URL of your Webflow website.
    - Save the changes to the `main.mjs` file.

3. **Run the Script**:
    - Open the command line/terminal in the project's root folder.
    - Execute the following command to start the download process:
      ```sh
      node main.mjs
      ```

4. **Retrieve the Downloaded Website**:
    - After a few seconds, you will find a ZIP file in the project's root folder. This ZIP file contains your downloaded website with all the CSS, HTML, JS, and images.
export const status_messages = {
  valid_website: (website) => `✅ Starting export for ${website}`,

  initial_message: () => "⚙️ Getting things ready...",

  new_page: (url) => `🌐 Processing: ${url}`,

  css: () => "🎨 Extracting styles...",

  js: () => "🛠️ Capturing scripts...",

  html: () => "📄 Downloading HTML...",

  images: () => "🖼️ Downloading images...",

  iframe: () => "🚫 Removing banners...",

  making_folders: () => "📂 Making folders...",

  making_zip: () => "📦 Creating ZIP file...",

  skipping_duplicate: () => "⏩ Skipping duplicate...",

  page_locally: () => "💾 Saving page...",

  removed_folders: () => "🧹 Cleaning up...",
  user_friendly_tools : ()=> "🧰 Adding some nice user friendly tools "
};

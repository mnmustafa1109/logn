export const SITE = {
  website: "https://nmustafa.dev/", // Your deployed domain
  author: "Noman Mustafa",
  profile: "https://nmustafa.dev/",
  desc: "Sharing my experiences and insight as a Software Architect and Cloud Engineer.",
  title: "Log of M",
  ogImage: "logo.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // Assuming you want to keep the back button enabled
  editPost: {
    enabled: true, // Enabled for editing
    text: "Suggest Changes", // Custom text from your previous config
    url: "https://github.com/mnmustafa1109/logn/edit/main/", // Updated base URL. Note: The new format doesn't directly support appending file path, you might need to handle this in your Astro component if necessary.
  },
  dynamicOgImage: true, // Assuming you don't need dynamic OG images unless specified
  dir: "auto", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Karachi", // Default global timezone (IANA format) - Using the sample's default
} as const;
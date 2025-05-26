import fs from "fs";
import path from "path";

interface ContentData {
  title: string;
  subtitle?: string;
  header_background_image?: string;
  youtubeVideoCode?: string;
  section1?: string;
  section1_image_url?: string;
  section2?: string;
  section2_image_url?: string;
  section3?: string;
  section3_image_url?: string;
  section4?: string;
  section4_image_url?: string;
  section5?: string;
  section5_image_url?: string;
  section6?: string;
  section6_image_url?: string;
  section7?: string;
  section7_image_url?: string;
  section8?: string;
  section8_image_url?: string;
  section9?: string;
  section9_image_url?: string;
  section10?: string;
  section10_image_url?: string;
}

export function generateHtmlFromTemplate(contentData: ContentData, templatePath: string = path.join(__dirname, "template.html")): string {
  try {
    // Read the template HTML file
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Fix the HTML structure first - there are some extra or misplaced closing tags
    // Fix section 4 structure
    htmlTemplate = htmlTemplate.replace(
      /<section class="section-4">[\s\S]*?<\/section>/,
      `<section class="section-4">
        <div class="parallax-bg" id="bg-4"></div>
        <div class="bg-overlay"></div>
        <div class="quote quote-4">
          <div class="line"></div>
        </div>
      </section>`
    );

    // Fix section 6 structure
    htmlTemplate = htmlTemplate.replace(
      /<section class="section-6">[\s\S]*?<\/section>/,
      `<section class="section-6">
        <div class="parallax-bg" id="bg-6"></div>
        <div class="bg-overlay"></div>
        <div class="quote quote-6">
          <div class="line"></div>
        </div>
      </section>`
    );

    // Fix section 8 structure
    htmlTemplate = htmlTemplate.replace(
      /<section class="section-8">[\s\S]*?<\/section>/,
      `<section class="section-8">
        <div class="parallax-bg" id="bg-8"></div>
        <div class="bg-overlay"></div>
        <div class="quote quote-8">
          <div class="line"></div>
        </div>
      </section>`
    );

    // Replace the title and subtitle
    htmlTemplate = htmlTemplate.replace(/\[title\]/gi, contentData.title);
    htmlTemplate = htmlTemplate.replace(/\[subtitle\]/gi, contentData.subtitle || "");

    // Replace YouTube video code
    if (contentData.youtubeVideoCode && contentData.youtubeVideoCode.trim() !== "") {
      // Replace the YouTube video code
      htmlTemplate = htmlTemplate.replace(/\[Video_Code\]/gi, contentData.youtubeVideoCode);
      
      // Make sure the music icon is visible
      htmlTemplate = htmlTemplate.replace(
        /<div class="music-player-container">/,
        `<div class="music-player-container" style="display: block;">`
      );
    } else {
      // If no YouTube video code, hide the music player container
      htmlTemplate = htmlTemplate.replace(
        /<div class="music-player-container">/,
        `<div class="music-player-container" style="display: none;">`
      );
    }

    // Update the background images in the JavaScript section
    const backgroundImagesScript = `
    // Set background images
    const backgroundImages = {
      "header-bg": "${contentData.header_background_image || ''}",
      "bg-1": "${contentData.section1_image_url || ''}",
      "bg-2": "${contentData.section2_image_url || ''}",
      "bg-3": "${contentData.section3_image_url || ''}",
      "bg-4": "${contentData.section4_image_url || ''}",
      "bg-5": "${contentData.section5_image_url || ''}",
      "bg-6": "${contentData.section6_image_url || ''}",
      "bg-7": "${contentData.section7_image_url || ''}",
      "bg-8": "${contentData.section8_image_url || ''}",
      "bg-9": "${contentData.section9_image_url || ''}",
      "bg-10": "${contentData.section10_image_url || ''}",
    };

    // Apply background images to sections
    document.addEventListener('DOMContentLoaded', () => {
      Object.entries(backgroundImages).forEach(([id, url]) => {
        if (url && url.startsWith('http')) {  // Only apply if it's a valid URL
          const element = document.getElementById(id);
          if (element) {
            element.style.backgroundImage = \`url('\${url}')\`;
          }
        }
      });
    });`;

    // Replace the existing background images object in the JavaScript
    htmlTemplate = htmlTemplate.replace(/\/\/ Set background images[\s\S]*?};/, backgroundImagesScript);

    // Add content to the quotes for each section
    for (let i = 1; i <= 10; i++) {
      const sectionKey = `section${i}` as keyof ContentData;
      const quoteContent = contentData[sectionKey];
      if (quoteContent) {
        // Find the line div for this section and replace content
        const lineSelector = new RegExp(`<div class="quote quote-${i}">\\s*<div class="line">.*?<\\/div>`, "s");
        const replacement = `<div class="quote quote-${i}">\n            <div class="line">${quoteContent}</div>`;
        htmlTemplate = htmlTemplate.replace(lineSelector, replacement);
      }
    }

    return htmlTemplate;
  } catch (error) {
    console.error("Error generating HTML from template:", error);
    throw error;
  }
} 
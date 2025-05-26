"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtmlFromTemplate = generateHtmlFromTemplate;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateHtmlFromTemplate(contentData, templatePath = path_1.default.join(__dirname, "template.html")) {
    try {
        // Read the template HTML file
        let htmlTemplate = fs_1.default.readFileSync(templatePath, "utf8");
        // Fix the HTML structure first - there are some extra or misplaced closing tags
        // Fix section 4 structure
        htmlTemplate = htmlTemplate.replace(/<section class="section-4">[\s\S]*?<\/section>/, `<section class="section-4">
        <div class="parallax-bg" id="bg-4"></div>
        <div class="bg-overlay"></div>
        <div class="quote quote-4">
          <div class="line"></div>
        </div>
      </section>`);
        // Fix section 6 structure
        htmlTemplate = htmlTemplate.replace(/<section class="section-6">[\s\S]*?<\/section>/, `<section class="section-6">
        <div class="parallax-bg" id="bg-6"></div>
        <div class="bg-overlay"></div>
        <div class="quote quote-6">
          <div class="line"></div>
        </div>
      </section>`);
        // Fix section 8 structure
        htmlTemplate = htmlTemplate.replace(/<section class="section-8">[\s\S]*?<\/section>/, `<section class="section-8">
        <div class="parallax-bg" id="bg-8"></div>
        <div class="bg-overlay"></div>
        <div class="quote quote-8">
          <div class="line"></div>
        </div>
      </section>`);
        // Replace the title and subtitle
        htmlTemplate = htmlTemplate.replace(/\[title\]/gi, contentData.title);
        htmlTemplate = htmlTemplate.replace(/\[subtitle\]/gi, contentData.subtitle || "");
        // Replace YouTube video code
        if (contentData.youtubeVideoCode && contentData.youtubeVideoCode.trim() !== "") {
            // Replace the YouTube video code
            htmlTemplate = htmlTemplate.replace(/\[Video_Code\]/gi, contentData.youtubeVideoCode);
            // Make sure the music icon is visible
            htmlTemplate = htmlTemplate.replace(/<div class="music-player-container">/, `<div class="music-player-container" style="display: block;">`);
        }
        else {
            // If no YouTube video code, hide the music player container
            htmlTemplate = htmlTemplate.replace(/<div class="music-player-container">/, `<div class="music-player-container" style="display: none;">`);
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
            const sectionKey = `section${i}`;
            const quoteContent = contentData[sectionKey];
            if (quoteContent) {
                // Find the line div for this section and replace content
                const lineSelector = new RegExp(`<div class="quote quote-${i}">\\s*<div class="line">.*?<\\/div>`, "s");
                const replacement = `<div class="quote quote-${i}">\n            <div class="line">${quoteContent}</div>`;
                htmlTemplate = htmlTemplate.replace(lineSelector, replacement);
            }
        }
        return htmlTemplate;
    }
    catch (error) {
        console.error("Error generating HTML from template:", error);
        throw error;
    }
}

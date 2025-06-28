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
        // Replace the title, subtitle, and username
        htmlTemplate = htmlTemplate.replace(/\[title\]/gi, contentData.title);
        htmlTemplate = htmlTemplate.replace(/\[subtitle\]/gi, contentData.subtitle || "");
        htmlTemplate = htmlTemplate.replace(/\[username\]/gi, contentData.username || "Anonymous");
        // Apply custom styling by updating CSS variables
        htmlTemplate = htmlTemplate.replace(/\[TEXT_COLOR\]/gi, contentData.textColor || "#f8f9fa");
        htmlTemplate = htmlTemplate.replace(/\[TITLE_COLOR\]/gi, contentData.titleColor || "#cccac4");
        htmlTemplate = htmlTemplate.replace(/\[FONT_FAMILY\]/gi, contentData.fontFamily || "Playfair Display");
        // Apply box background color and opacity
        const boxBgColor = contentData.boxBgColor || "#585858";
        const boxOpacity = contentData.boxOpacity !== undefined ? contentData.boxOpacity : 0.5;
        // Add the box background styling to the CSS in the template
        const boxBgStyleRegex = /\.quote\s*{[^}]*background:[^;]*;/;
        const boxBgReplacement = `.quote {
  background: rgba(${parseInt(boxBgColor.slice(1, 3), 16)}, ${parseInt(boxBgColor.slice(3, 5), 16)}, ${parseInt(boxBgColor.slice(5, 7), 16)}, ${boxOpacity});`;
        htmlTemplate = htmlTemplate.replace(boxBgStyleRegex, boxBgReplacement);
        // Replace YouTube video code and handle music player visibility
        const hasValidVideoCode = contentData.youtubeVideoCode &&
            typeof contentData.youtubeVideoCode === "string" &&
            contentData.youtubeVideoCode.trim() !== "" &&
            contentData.youtubeVideoCode.trim() !== "undefined" &&
            contentData.youtubeVideoCode.trim() !== "null";
        if (hasValidVideoCode) {
            // Replace the YouTube video code
            htmlTemplate = htmlTemplate.replace(/\[Video_Code\]/gi, contentData.youtubeVideoCode.trim());
            // Make sure the music player container is visible
            htmlTemplate = htmlTemplate.replace(/<div class="music-player-container">/, `<div class="music-player-container" style="display: block !important;">`);
        }
        else {
            // If no valid YouTube video code, replace with empty string and hide the music player container
            htmlTemplate = htmlTemplate.replace(/\[Video_Code\]/gi, "");
            // Hide the music player container
            htmlTemplate = htmlTemplate.replace(/<div class="music-player-container">/, `<div class="music-player-container" style="display: none !important;">`);
        }
        // Update the background images in the JavaScript section
        htmlTemplate = htmlTemplate.replace(/\[Header_background\]/gi, contentData.header_background_image || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_1\]/gi, contentData.section1_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_2\]/gi, contentData.section2_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_3\]/gi, contentData.section3_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_4\]/gi, contentData.section4_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_5\]/gi, contentData.section5_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_6\]/gi, contentData.section6_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_7\]/gi, contentData.section7_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_8\]/gi, contentData.section8_image_url || "");
        htmlTemplate = htmlTemplate.replace(/\[BG_9\]/gi, contentData.section9_image_url || "");
        // Set the background effect
        htmlTemplate = htmlTemplate.replace(/\[BACKGROUND_EFFECT\]/gi, contentData.backgroundEffect || "none");
        // Note: Background effects are now handled by the external background-effects.js script
        // The effect type is stored in window.essayBackgroundEffect for the script to use
        // Remove the old inline background effect implementations since they're replaced by the external script
        // Add debug logging for background effect
        const debugScript = `
    <script>
      // Define backgroundEffect in the global scope
      window.backgroundEffect = "${contentData.backgroundEffect || "none"}";
      console.log("Background effect replaced to:", window.backgroundEffect);
      
      // Add a fallback initialization for the background effect
      document.addEventListener("DOMContentLoaded", function() {
        setTimeout(function() {
          if (typeof initBackgroundEffect === 'function' && !document.querySelector('.background-effect-container')) {
            console.log("Fallback: Initializing background effect from replace.ts:", window.backgroundEffect);
            initBackgroundEffect(window.backgroundEffect);
          }
          
          // Additional check to fix z-index issues
          setTimeout(function() {
            const bgContainer = document.querySelector('.background-effect-container');
            if (bgContainer) {
              console.log("Applying force styles to background effect container");
              bgContainer.style.position = 'fixed';
              bgContainer.style.top = '0';
              bgContainer.style.left = '0';
              bgContainer.style.width = '100%';
              bgContainer.style.height = '100%';
              bgContainer.style.pointerEvents = 'none';
              bgContainer.style.zIndex = '5';
              bgContainer.style.overflow = 'hidden';
              
              // Fix any parent element z-index issues
              const bgOverlays = document.querySelectorAll('.bg-overlay');
              if (bgOverlays.length > 0) {
                console.log("Setting correct z-index for overlays");
                bgOverlays.forEach(overlay => {
                  overlay.style.zIndex = '2'; // Keep this below the background effect
                });
              }
              
              // Make sure content is above the background effect
              const quoteElements = document.querySelectorAll('.quote');
              if (quoteElements.length > 0) {
                console.log("Setting correct z-index for content");
                quoteElements.forEach(quote => {
                  quote.style.zIndex = '10'; // Keep this above the background effect
                  quote.style.position = 'relative'; // Ensure z-index works
                });
              }
            }
          }, 1500);
        }, 1000);
      });
    </script>`;
        // Insert debug script before the closing body tag
        htmlTemplate = htmlTemplate.replace("</body>", `${debugScript}\n</body>`);
        // Add content to the quotes for each section
        for (let i = 1; i <= 9; i++) {
            const sectionKey = `section${i}`;
            const quoteContent = contentData[sectionKey];
            if (quoteContent) {
                // Find the line div for this section and replace content
                const lineSelector = new RegExp(`<div class=\"quote quote-${i}\">\\s*<div class=\"line\">.*?<\\/div>`, "s");
                const replacement = `<div class=\"quote quote-${i}\">\n            <div class=\"line\">${quoteContent}</div>`;
                htmlTemplate = htmlTemplate.replace(lineSelector, replacement);
            }
        }
        return htmlTemplate;
    }
    catch (error) {
        console.error("Error generating HTML from template:", error);
        return "";
    }
}

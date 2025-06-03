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
        htmlTemplate = htmlTemplate.replace(/\[BG_10\]/gi, contentData.section10_image_url || "");
        // Set the background effect
        htmlTemplate = htmlTemplate.replace(/\[BACKGROUND_EFFECT\]/gi, contentData.backgroundEffect || "none");
        // Add background effects directly based on selection
        if (contentData.backgroundEffect === "heart") {
            const heartEffectCode = `
  <!-- Heart Effect -->
  <style>
    .heart {
      position: fixed;
      font-size: 1.5rem;
      top: -1vh;
      transform: translateY(0);
      animation: fall 3s linear forwards;
      pointer-events: none;
      z-index: 5;
    }

    @keyframes fall {
      from {
        transform: translateY(0vh) translateX(-10vw); 
      }
      to {
        transform: translateY(105vh) translateX(10vw); 
      }
    }
  </style>
  <script>
    function createHeart() {
      const heart = document.createElement('div');
      heart.classList.add('heart');
      heart.style.left = Math.random() * 100 + "vw";
      heart.style.animationDuration = Math.random() * 2 + 3 + "s";
      heart.innerHTML = '💗';
      document.body.appendChild(heart);
      
      setTimeout(() => {
        heart.remove();
      }, 5000);
    }

    // Create hearts continuously
    setInterval(createHeart, 300);
  </script>`;
            // Insert heart effect code before the closing body tag
            htmlTemplate = htmlTemplate.replace('</body>', `${heartEffectCode}\n</body>`);
        }
        else if (contentData.backgroundEffect === "firefly") {
            const fireflyEffectCode = `
  <!-- Firefly Effect -->
  <style>
    .firefly {
      position: fixed;
      left: 50%;
      top: 50%;
      width: 0.4vw;
      height: 0.4vw;
      margin: -0.2vw 0 0 9.8vw;
      pointer-events: none;
      animation: ease 200s alternate infinite;
      z-index: 5;
    }

    .firefly::before,
    .firefly::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transform-origin: -10vw;
    }

    .firefly::before {
      background: black;
      opacity: 0.4;
      animation: drift ease alternate infinite;
    }

    .firefly::after {
      background: white;
      opacity: 0;
      box-shadow: 0 0 0vw 0vw yellow;
      animation: drift ease alternate infinite, flash ease infinite;
    }

    @keyframes drift {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes flash {
      0%, 30%, 100% {
        opacity: 0;
        box-shadow: 0 0 0vw 0vw yellow;
      }
      5% {
        opacity: 1;
        box-shadow: 0 0 2vw 0.4vw yellow;
      }
    }
  </style>
  <script>
    const quantity = 50;
    for (let i = 1; i <= quantity; i++) {
      const firefly = document.createElement('div');
      firefly.className = 'firefly';

      const steps = Math.floor(Math.random() * 12) + 16;
      const rotationSpeed = Math.floor(Math.random() * 10) + 8;
      const flashDuration = Math.floor(Math.random() * 6000) + 5000;
      const flashDelay = Math.floor(Math.random() * 8000) + 500;

      const moveName = \`move\${i}\`;
      let keyframes = \`@keyframes \${moveName} {\`;
      for (let step = 0; step <= steps; step++) {
        const percent = (step * 100) / steps;
        const x = Math.floor(Math.random() * 100) - 50;
        const y = Math.floor(Math.random() * 100) - 50;
        const scale = Math.random() * 0.75 + 0.25;
        keyframes += \`\${percent}% { transform: translateX(\${x}vw) translateY(\${y}vh) scale(\${scale}); }\`;
      }
      keyframes += '}';

      const styleSheet = document.styleSheets[0];
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

      firefly.style.animationName = moveName;

      firefly.style.setProperty('--rotationSpeed', \`\${rotationSpeed}s\`);
      firefly.style.setProperty('--flashDuration', \`\${flashDuration}ms\`);
      firefly.style.setProperty('--flashDelay', \`\${flashDelay}ms\`);

      firefly.innerHTML = \`
        <style>
          .firefly:nth-child(\${i})::before {
            animation-duration: \${rotationSpeed}s;
          }
          .firefly:nth-child(\${i})::after {
            animation-duration: \${rotationSpeed}s, \${flashDuration}ms;
            animation-delay: 0ms, \${flashDelay}ms;
          }
        </style>
      \`;

      document.body.appendChild(firefly);
    }
  </script>`;
            // Insert firefly effect code before the closing body tag
            htmlTemplate = htmlTemplate.replace('</body>', `${fireflyEffectCode}\n</body>`);
        }
        else if (contentData.backgroundEffect === "particles") {
            const particlesEffectCode = `
  <!-- Particles Effect -->
  <style>
    .particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 5;
    }
    
    .particle:nth-child(3n) {
      width: 4px;
      height: 4px;
      background-color: rgba(93, 95, 226, 0.8);
      animation: float 25s infinite ease-in-out;
      animation-delay: -5s;
      box-shadow: 0 0 5px rgba(93, 95, 226, 0.5);
    }
    
    .particle:nth-child(4n) {
      width: 8px;
      height: 8px;
      background-color: rgba(255, 107, 139, 0.8);
      animation: float 20s infinite ease-in-out;
      animation-delay: -10s;
      box-shadow: 0 0 5px rgba(255, 107, 139, 0.5);
    }
    
    .particle {
      width: 6px;
      height: 6px;
      background-color: rgba(255, 255, 255, 0.8);
      animation: float 15s infinite;
      opacity: 0.6;
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    }

    @keyframes float {
      0% {
        transform: translateY(100vh);
        opacity: 0;
      }
      5% {
        opacity: 0.6;
      }
      95% {
        opacity: 0.6;
      }
      100% {
        transform: translateY(-10vh);
        opacity: 0;
      }
    }
  </style>
  <script>
    function createParticles() {
      const container = document.createElement('div');
      container.className = 'background-effect-container';
      container.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; z-index: 5;";
      document.body.appendChild(container);
      
      // Particle colors (will be set through CSS)
      const colors = [
        '#ffffff', // White
        '#7f7fd5', // Purple
        '#86a8e7', // Blue
        '#91eae4'  // Cyan
      ];
      
      // Create particles
      for (let i = 0; i < 150; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random positioning across the full width
        const left = Math.random() * 100;
        particle.style.left = \`\${left}%\`;
        
        // Random starting position - distributed across the full height
        const bottom = Math.random() * 100;
        particle.style.bottom = \`\${bottom}%\`;
        
        // Add random delay to make movement more natural
        const delay = Math.random() * 20;
        particle.style.animationDelay = \`\${delay}s\`;
        
        container.appendChild(particle);
      }
    }

    // Create particles when the page loads
    document.addEventListener('DOMContentLoaded', createParticles);
    
    // Make function available globally
    window.initBackgroundEffect = function(effect) {
      if (effect === 'particles' && !document.querySelector('.background-effect-container')) {
        console.log("Initializing particles effect");
        createParticles();
      }
    };
  </script>`;
            // Insert particles effect code before the closing body tag
            htmlTemplate = htmlTemplate.replace('</body>', `${particlesEffectCode}\n</body>`);
        }
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
        htmlTemplate = htmlTemplate.replace('</body>', `${debugScript}\n</body>`);
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

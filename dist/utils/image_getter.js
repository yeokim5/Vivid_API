"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrls = getImageUrls;
exports.cleanup = cleanup;
const puppeteer = require("puppeteer");
// Global browser instance
let browserInstance = null;
// Initialize browser instance
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
            ],
            defaultViewport: { width: 1920, height: 1080 },
        });
    }
    return browserInstance;
}
// Helper function to wait with reduced time
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Function to extract images from page
async function extractImages(page) {
    return page.evaluate(() => {
        const imageContainers = Array.from(document.querySelectorAll("div.h-min.w-auto.relative.z-10"));
        const images = imageContainers
            .map((container) => {
            const img = container.querySelector("img");
            const link = container.querySelector("a");
            if (!img?.src)
                return null;
            const isPro = img.src.includes("/api/pro/") ||
                link?.href.includes("/pro/") ||
                container.querySelector("[data-pro]") !== null;
            return isPro ? null : img.src;
        })
            .filter(Boolean);
        // Also get any additional images that match our criteria
        const additionalImages = Array.from(document.querySelectorAll("img"))
            .filter((img) => img.src &&
            img.src.includes("lummi.ai") &&
            !img.src.includes("/api/pro/") &&
            img.src.includes("?asset=original"))
            .map((img) => img.src);
        return [...new Set([...images, ...additionalImages])];
    });
}
// Function to get image URLs from Lummi based on a prompt
async function getImageUrls(prompt, maxImages = 10) {
    console.log(`Searching for images with prompt: "${prompt}"`);
    const encodedPrompt = encodeURIComponent(prompt);
    const searchUrl = `https://www.lummi.ai/s/photo/${encodedPrompt}`;
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        // Set optimized page configurations
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36");
        // Disable unnecessary features
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
                request.continue();
            }
            else {
                request.continue();
            }
        });
        // Navigate with optimized settings
        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        // Initial wait for content
        await wait(2000);
        let lummiImages = [];
        let attempts = 0;
        const maxAttempts = 3;
        while (lummiImages.length < maxImages && attempts < maxAttempts) {
            attempts++;
            // Extract images from current state
            const currentImages = await extractImages(page);
            // Add new unique images
            const newImages = currentImages.filter((src) => !lummiImages.includes(src));
            lummiImages.push(...newImages);
            if (lummiImages.length >= maxImages)
                break;
            // Scroll and wait for new content
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            await wait(1000);
        }
        // Limit to maxImages URLs
        lummiImages = lummiImages.slice(0, maxImages);
        return {
            success: true,
            message: `Found ${lummiImages.length} image URLs from Lummi`,
            urls: lummiImages,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error:", errorMessage);
        return {
            success: false,
            message: errorMessage,
            urls: [],
        };
    }
    finally {
        await page.close();
    }
}
// Cleanup function to close browser instance
async function cleanup() {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrls = getImageUrls;
const puppeteer = require("puppeteer");
// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Function to get image URLs from Lummi based on a prompt
async function getImageUrls(prompt, maxImages = 10) {
    console.log(`Searching for images with prompt: "${prompt}"`);
    const encodedPrompt = encodeURIComponent(prompt);
    const searchUrl = `https://www.lummi.ai/s/photo/${encodedPrompt}`;
    console.log(`URL: ${searchUrl}`);
    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode for API use
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    // Set viewport to desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    // Set user agent to look like a regular browser
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36");
    try {
        console.log("Navigating to the search URL...");
        await page.goto(searchUrl, {
            waitUntil: "networkidle2",
            timeout: 120000, // 2 minute timeout
        });
        // Wait for page to fully render
        await wait(5000);
        console.log("Extracting image URLs from Lummi...");
        let lummiImages = [];
        let attempts = 0;
        const maxAttempts = 5;
        // Keep trying until we get enough images or reach max attempts
        while (lummiImages.length < maxImages && attempts < maxAttempts) {
            attempts++;
            console.log(`Attempt ${attempts} - Currently found ${lummiImages.length} images`);
            // Extract images from the current page state
            const currentImages = await page.evaluate(() => {
                // Look for image containers with the specific structure
                const imageContainers = Array.from(document.querySelectorAll("div.h-min.w-auto.relative.z-10"));
                return imageContainers
                    .map((container) => {
                    const img = container.querySelector("img");
                    const link = container.querySelector("a");
                    if (!img || !img.src)
                        return null;
                    // Check if this is a pro image by looking for pro URL patterns
                    const isPro = img.src.includes("/api/pro/") ||
                        link?.href.includes("/pro/") ||
                        container.querySelector("[data-pro]") !== null;
                    if (isPro)
                        return null;
                    return {
                        src: img.src,
                        alt: img.alt || "",
                        href: link?.href || "",
                    };
                })
                    .filter((item) => item !== null)
                    .map((item) => item.src);
            });
            // Add new unique images
            const newImages = currentImages.filter((src) => !lummiImages.includes(src));
            lummiImages.push(...newImages);
            console.log(`Found ${newImages.length} new images in attempt ${attempts}`);
            // If we have enough images, break
            if (lummiImages.length >= maxImages) {
                break;
            }
            // Scroll down to load more images
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            // Wait for new content to load
            await wait(3000);
        }
        // Alternative method if we still don't have enough images
        if (lummiImages.length < maxImages) {
            console.log("Trying alternative extraction method...");
            const altImages = await page.evaluate(() => {
                // Look for any img tags with lummi.ai URLs that aren't pro
                const allImages = Array.from(document.querySelectorAll("img"));
                return allImages
                    .filter((img) => img.src &&
                    img.src.includes("lummi.ai") &&
                    !img.src.includes("/api/pro/") &&
                    img.src.includes("?asset=original"))
                    .map((img) => img.src);
            });
            // Add unique images from alternative method
            const newAltImages = altImages.filter((src) => !lummiImages.includes(src));
            lummiImages.push(...newAltImages);
            console.log(`Alternative method found ${newAltImages.length} additional images`);
        }
        // Limit to maxImages URLs
        lummiImages = lummiImages.slice(0, maxImages);
        console.log(`Final result: ${lummiImages.length} images found`);
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
        await browser.close();
    }
}

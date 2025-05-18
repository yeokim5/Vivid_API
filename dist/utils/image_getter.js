"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrls = getImageUrls;
const puppeteer = require("puppeteer");
// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Function to get image URLs based on a prompt
async function getImageUrls(prompt, maxImages = 10) {
    console.log(`Searching for images with prompt: "${prompt}"`);
    const encodedPrompt = encodeURIComponent(prompt);
    const searchUrl = `https://stockcake.com/s?q=${encodedPrompt}`;
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
        // Get all image src URLs
        console.log("Extracting all image URLs from the page...");
        const imageUrls = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll("img"));
            return images
                .map((img) => {
                return {
                    src: img.src,
                    alt: img.alt || "",
                    width: img.width,
                    height: img.height,
                    class: img.className || "",
                };
            })
                .filter((img) => img.src);
        });
        console.log(`Found ${imageUrls.length} total images on the page`);
        // Filter for stockcake images with flexible patterns
        let stockcakeImages = imageUrls
            .filter((img) => img.src.includes("stockcake.com") &&
            img.src.includes(".jpg") &&
            img.width > 100 &&
            img.height > 100 // Filter out thumbnails/icons
        )
            .map((img) => img.src);
        console.log(`Found ${stockcakeImages.length} matching stockcake images`);
        // Try an alternative method if no images found
        if (stockcakeImages.length === 0) {
            console.log("No stockcake images found with primary method. Trying alternative approach...");
            // Get all links and look for image URLs in href attributes
            const imageLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll("a"));
                return links
                    .map((link) => link.href)
                    .filter((href) => href &&
                    href.includes("stockcake.com") &&
                    (href.includes(".jpg") || href.includes("/public/")));
            });
            console.log(`Found ${imageLinks.length} potential image links`);
            if (imageLinks.length > 0) {
                stockcakeImages.push(...imageLinks);
            }
        }
        // Limit to maxImages URLs
        stockcakeImages = stockcakeImages.slice(0, maxImages);
        return {
            success: true,
            message: `Found ${stockcakeImages.length} image URLs`,
            urls: stockcakeImages,
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

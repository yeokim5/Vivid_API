"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBackgroundImageSuggestions = exports.cleanupOngoingFetches = exports.searchImages = void 0;
const image_getter_1 = require("../utils/image_getter");
// Cache to store ongoing image fetches
const ongoingFetches = new Map();
// Handle cleanup on server shutdown
process.on('SIGTERM', async () => {
    await (0, image_getter_1.cleanup)();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await (0, image_getter_1.cleanup)();
    process.exit(0);
});
const searchImages = async (req, res) => {
    const sectionId = req.body.sectionId;
    const cacheKey = sectionId ? `${req.body.prompt}_${sectionId}` : null;
    try {
        const { prompt, maxImages } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
            });
        }
        // If this is a sequential fetch request
        if (sectionId) {
            // If there's already a fetch in progress for this section, return it
            if (ongoingFetches.has(cacheKey)) {
                const result = await ongoingFetches.get(cacheKey);
                ongoingFetches.delete(cacheKey);
                return res.json(result);
            }
            // Start a new fetch and store it in the cache
            const fetchPromise = (0, image_getter_1.getImageUrls)(prompt, maxImages || 10);
            ongoingFetches.set(cacheKey, fetchPromise);
            try {
                const result = await fetchPromise;
                ongoingFetches.delete(cacheKey);
                return res.json(result);
            }
            catch (error) {
                ongoingFetches.delete(cacheKey);
                throw error;
            }
        }
        // Regular fetch
        const result = await (0, image_getter_1.getImageUrls)(prompt, maxImages || 10);
        res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Image search error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
            error: errorMessage,
        });
    }
};
exports.searchImages = searchImages;
// Handle request cancellation
const cleanupOngoingFetches = (sectionId) => {
    if (sectionId) {
        const cacheKey = `${sectionId}`;
        ongoingFetches.delete(cacheKey);
    }
    else {
        ongoingFetches.clear();
    }
};
exports.cleanupOngoingFetches = cleanupOngoingFetches;
const processBackgroundImageSuggestions = async (req, res) => {
    try {
        const { suggestions } = req.body;
        if (!suggestions || !Object.keys(suggestions).length) {
            return res.status(400).json({
                success: false,
                message: "Background image suggestions are required",
            });
        }
        const results = {};
        const suggestionsEntries = Object.entries(suggestions);
        // Process each suggestion one by one
        for (const [key, prompt] of suggestionsEntries) {
            if (typeof prompt === "string") {
                console.log(`Processing suggestion for ${key}: "${prompt}"`);
                const result = await (0, image_getter_1.getImageUrls)(prompt, 10);
                results[key] = {
                    prompt,
                    ...result,
                };
            }
        }
        return res.json({
            success: true,
            message: `Processed ${Object.keys(results).length} background image suggestions`,
            data: results,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Background image processing error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
            error: errorMessage,
        });
    }
};
exports.processBackgroundImageSuggestions = processBackgroundImageSuggestions;

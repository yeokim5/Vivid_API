"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBackgroundImageSuggestions = exports.searchImages = void 0;
const image_getter_1 = require("../utils/image_getter");
const searchImages = async (req, res) => {
    try {
        const { prompt, maxImages } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
            });
        }
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

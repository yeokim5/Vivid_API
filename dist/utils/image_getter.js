"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrls = getImageUrls;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const LUMMI_API_KEY = process.env.LUMMI_API_KEY;
const LUMMI_API_URL = "https://api.lummi.ai/v1/images/search";
async function getImageUrls(prompt, maxImages = 1) {
    if (!LUMMI_API_KEY) {
        return {
            success: false,
            message: "LUMMI_API_KEY is not set in environment",
            urls: [],
        };
    }
    try {
        // Build params for logging
        const params = {
            query: prompt,
            perPage: maxImages,
            free: true,
        };
        // Build the URL for logging
        const url = `${LUMMI_API_URL}?query=${encodeURIComponent(prompt)}&perPage=${maxImages}&free=true`;
        const response = await axios_1.default.get(LUMMI_API_URL, {
            headers: {
                Authorization: `Bearer ${LUMMI_API_KEY}`,
            },
            params,
        });
        const data = response.data;
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Return the image URLs (use .url property)
            const urls = data.data.map((img) => img.url).filter(Boolean);
            return {
                success: true,
                message: `Found ${urls.length} image URLs from Lummi API`,
                urls,
            };
        }
        else {
            return {
                success: true,
                message: "No images found",
                urls: [],
            };
        }
    }
    catch (error) {
        const errorMessage = error?.response?.data?.message || error.message || "Unknown error";
        return {
            success: false,
            message: errorMessage,
            urls: [],
        };
    }
}

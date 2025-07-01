"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEssayJson = exports.divideSongIntoSections = void 0;
const openai_1 = __importDefault(require("openai"));
const nlpChunk_1 = require("../utils/nlpChunk");
const backgroundImage_1 = __importDefault(require("../utils/backgroundImage"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const image_getter_1 = require("../utils/image_getter");
const queueManager_1 = require("../utils/queueManager");
// Initialize the OpenAI client with API key
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// Always use exactly 9 sections
const SECTION_COUNT = 9;
// Helper sleep function
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const divideSongIntoSections = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }
        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
        }
        const userId = req.user.id || req.user._id;
        // Check if this user is currently processing (already started via /queue/start)
        if (queueManager_1.queueManager.isUserProcessing(userId)) {
            // User is already processing, allow them to continue
            console.log(`[SECTIONS] User ${userId} is currently processing, allowing to continue`);
        }
        else {
            // User is not processing, check if they can start
            if (!queueManager_1.queueManager.canProcess()) {
                return res.status(429).json({
                    success: false,
                    error: "Rate limit exceeded. Please check queue status.",
                    shouldCheckQueue: true,
                });
            }
            // Check if this user is next in queue (if there is a queue)
            const nextItem = queueManager_1.queueManager.getNextForProcessing();
            if (nextItem && nextItem.userId !== userId) {
                return res.status(429).json({
                    success: false,
                    error: "Not your turn to process. Please wait in queue.",
                    shouldCheckQueue: true,
                });
            }
            // Start processing for this user
            if (nextItem && nextItem.userId === userId) {
                queueManager_1.queueManager.startProcessing(userId);
            }
            else if (queueManager_1.queueManager.canProcess()) {
                // No queue, can start immediately
                queueManager_1.queueManager.startProcessing(userId);
            }
        }
        // Step 1: Divide content into exactly 9 sections using NLP
        const sections = (0, nlpChunk_1.processText)(content, SECTION_COUNT);
        // Ensure we have exactly 9 sections
        const sectionKeys = Object.keys(sections);
        if (sectionKeys.length < SECTION_COUNT) {
            // If we have fewer than 9 sections, add empty ones to reach 9
            for (let i = sectionKeys.length + 1; i <= SECTION_COUNT; i++) {
                sections[`section_${i}`] =
                    "Content for this section will be generated.";
            }
        }
        // Step 2: Generate background images for each section
        const backgroundImageInput = {
            title,
            sections,
        };
        // Generate background images using GPT
        const backgroundImages = await (0, backgroundImage_1.default)(backgroundImageInput);
        // Parse the background images JSON if it's a string
        let parsedBackgroundImages;
        if (typeof backgroundImages === "string") {
            try {
                parsedBackgroundImages = JSON.parse(backgroundImages);
            }
            catch (e) {
                console.error("Error parsing background images:", e);
                parsedBackgroundImages = {};
            }
        }
        else {
            parsedBackgroundImages = backgroundImages;
        }
        // Fetch header background image if present
        let header_background_image_url = "";
        let lummiRequestCount = 0;
        if (parsedBackgroundImages.header_background_image) {
            let headerPrompt = "";
            let headerDescription = "";
            if (typeof parsedBackgroundImages.header_background_image === "object") {
                headerPrompt =
                    parsedBackgroundImages.header_background_image.keyword || "";
                headerDescription =
                    parsedBackgroundImages.header_background_image.description || "";
            }
            else if (typeof parsedBackgroundImages.header_background_image === "string") {
                headerPrompt = parsedBackgroundImages.header_background_image;
            }
            if (headerPrompt) {
                let headerResult = await (0, image_getter_1.getImageUrls)(headerPrompt, 1);
                lummiRequestCount++;
                if (!headerResult.success || headerResult.urls.length === 0) {
                    // Fallback: try description
                    if (headerDescription) {
                        headerResult = await (0, image_getter_1.getImageUrls)(headerDescription, 1);
                        lummiRequestCount++;
                    }
                }
                if (headerResult.success && headerResult.urls.length > 0) {
                    header_background_image_url = headerResult.urls[0];
                }
                else {
                    // Fallback: use a default placeholder image
                    header_background_image_url =
                        "https://assets.lummi.ai/assets/default-placeholder.jpg";
                }
            }
        }
        // Combine sections with their background images
        const sectionData = [];
        // Ensure we create exactly 9 sections
        for (let i = 1; i <= SECTION_COUNT; i++) {
            // Throttle: after 10 requests, wait 60 seconds before the 11th
            if (lummiRequestCount === 10) {
                console.log("[LUMMI] Rate limit reached. Waiting 60 seconds before next request...");
                await sleep(60000);
                lummiRequestCount = 0; // Reset for safety (if you ever have more than 11 images)
            }
            const key = `section_${i}`;
            const imageKey = `section_${i}_background_image`;
            let sectionPrompt = "";
            let sectionDescription = "";
            if (parsedBackgroundImages[imageKey]) {
                if (typeof parsedBackgroundImages[imageKey] === "object") {
                    sectionPrompt = parsedBackgroundImages[imageKey].keyword || "";
                    sectionDescription =
                        parsedBackgroundImages[imageKey].description || "";
                }
                else if (typeof parsedBackgroundImages[imageKey] === "string") {
                    sectionPrompt = parsedBackgroundImages[imageKey];
                }
            }
            // Try keyword first, then description, then fallback
            let sectionImageUrl = "";
            if (sectionPrompt) {
                let sectionResult = await (0, image_getter_1.getImageUrls)(sectionPrompt, 1);
                lummiRequestCount++;
                if (!sectionResult.success || sectionResult.urls.length === 0) {
                    // Fallback: try description
                    if (sectionDescription) {
                        sectionResult = await (0, image_getter_1.getImageUrls)(sectionDescription, 1);
                        lummiRequestCount++;
                    }
                }
                if (sectionResult.success && sectionResult.urls.length > 0) {
                    sectionImageUrl = sectionResult.urls[0];
                }
                else {
                    // Fallback: use a default placeholder image
                    sectionImageUrl =
                        "https://assets.lummi.ai/assets/default-placeholder.jpg";
                }
            }
            else {
                sectionImageUrl =
                    "https://assets.lummi.ai/assets/default-placeholder.jpg";
            }
            sectionData.push({
                section_number: i,
                content: sections[key] || "Content for this section will be generated.",
                background_image: sectionPrompt || sectionDescription || "Generic landscape background",
                selected_image_url: sectionImageUrl,
            });
        }
        // Return combined data to frontend
        const responseData = {
            success: true,
            data: {
                title,
                subtitle: parsedBackgroundImages.subtitle || "",
                header_background_image: parsedBackgroundImages.header_background_image || "",
                header_background_image_url,
                sections: sectionData,
            },
        };
        // Complete processing and remove from queue
        queueManager_1.queueManager.completeProcessing(userId);
        return res.status(200).json(responseData);
    }
    catch (error) {
        console.error("Error:", error);
        // Complete processing on error (cleanup)
        if (req.user) {
            const userId = req.user.id || req.user._id;
            queueManager_1.queueManager.completeProcessing(userId);
        }
        return res.status(500).json({
            success: false,
            error: "Failed to process content",
        });
    }
};
exports.divideSongIntoSections = divideSongIntoSections;
const generateEssayJson = async (req, res) => {
    try {
        const { title, sections } = req.body;
        if (!title || !sections || !Array.isArray(sections)) {
            return res.status(400).json({
                success: false,
                error: "Title and sections array are required",
            });
        }
        // Create the essay JSON structure
        const essayJson = {
            title: title,
        };
        // Add each section's content and image URL to the JSON
        sections.forEach((section) => {
            const sectionNumber = section.section_number;
            essayJson[`section${sectionNumber}`] = section.content;
            essayJson[`section${sectionNumber}_image_url`] =
                section.selected_image_url || "";
        });
        // Generate a unique filename based on timestamp and title
        const timestamp = Date.now();
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const filename = `essay_${sanitizedTitle}_${timestamp}.json`;
        // Create uploads directory if it doesn't exist
        const uploadsDir = path_1.default.join(__dirname, "../../uploads");
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path_1.default.join(uploadsDir, filename);
        // Write the JSON file
        fs_1.default.writeFileSync(filePath, JSON.stringify(essayJson, null, 2));
        return res.status(200).json({
            success: true,
            message: "Essay JSON file generated successfully",
            filename: filename,
            filePath: `/uploads/${filename}`,
            essayJson: essayJson,
        });
    }
    catch (error) {
        console.error("Error generating essay JSON:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate essay JSON",
        });
    }
};
exports.generateEssayJson = generateEssayJson;

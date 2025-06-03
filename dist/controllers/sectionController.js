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
// Initialize the OpenAI client with API key
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// Always use exactly 10 sections
const SECTION_COUNT = 10;
const divideSongIntoSections = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }
        // Step 1: Divide content into exactly 10 sections using NLP
        const sections = (0, nlpChunk_1.processText)(content, SECTION_COUNT);
        console.log("NLP Sections:", sections);
        // Ensure we have exactly 10 sections
        const sectionKeys = Object.keys(sections);
        if (sectionKeys.length < SECTION_COUNT) {
            // If we have fewer than 10 sections, add empty ones to reach 10
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
        if (parsedBackgroundImages.header_background_image) {
            const headerResult = await (0, image_getter_1.getImageUrls)(parsedBackgroundImages.header_background_image, 1);
            if (headerResult.success && headerResult.urls.length > 0) {
                header_background_image_url = headerResult.urls[0];
            }
        }
        // Combine sections with their background images
        const sectionData = [];
        // Ensure we create exactly 10 sections
        for (let i = 1; i <= SECTION_COUNT; i++) {
            const key = `section_${i}`;
            const imageKey = `section_${i}_background_image`;
            sectionData.push({
                section_number: i,
                content: sections[key] || "Content for this section will be generated.",
                background_image: parsedBackgroundImages[imageKey] || "Generic landscape background",
            });
        }
        // Return combined data to frontend
        return res.status(200).json({
            success: true,
            data: {
                title,
                subtitle: parsedBackgroundImages.subtitle || "",
                header_background_image: parsedBackgroundImages.header_background_image || "",
                header_background_image_url,
                sections: sectionData,
            },
        });
    }
    catch (error) {
        console.error("Error:", error);
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

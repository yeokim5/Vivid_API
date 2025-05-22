"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEssayById = exports.createHtmlEssay = exports.deleteEssay = exports.updateEssay = exports.getEssayById = exports.getUserEssays = exports.createEssay = void 0;
const Essay_1 = __importDefault(require("../models/Essay"));
const path_1 = __importDefault(require("path"));
const replace_1 = require("../utils/replace");
// Create a new essay
const createEssay = async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        if (!title || !content) {
            res.status(400).json({ message: "Title and content are required" });
            return;
        }
        // Ensure user is authenticated
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        // Create new essay
        const essay = await Essay_1.default.create({
            title,
            content,
            author: req.user.id || req.user._id,
            tags: tags || [],
        });
        res.status(201).json({
            message: "Essay created successfully",
            essay: {
                id: essay._id,
                title: essay.title,
                content: essay.content,
                tags: essay.tags,
            },
        });
    }
    catch (error) {
        console.error("Create essay error:", error);
        res.status(500).json({ message: "Failed to create essay" });
    }
};
exports.createEssay = createEssay;
// Get all essays for a user
const getUserEssays = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        const userId = req.user.id || req.user._id;
        const essays = await Essay_1.default.find({ author: userId })
            .sort({ createdAt: -1 })
            .select("title createdAt isPublished views tags");
        res.status(200).json({ essays });
    }
    catch (error) {
        console.error("Get user essays error:", error);
        res.status(500).json({ message: "Failed to retrieve essays" });
    }
};
exports.getUserEssays = getUserEssays;
// Get essay by ID
const getEssayById = async (req, res) => {
    try {
        const { id } = req.params;
        const essay = await Essay_1.default.findById(id);
        if (!essay) {
            res.status(404).json({ message: "Essay not found" });
            return;
        }
        // Increment view count for published essays
        if (essay.isPublished) {
            essay.views += 1;
            await essay.save();
        }
        res.status(200).json({ essay });
    }
    catch (error) {
        console.error("Get essay error:", error);
        res.status(500).json({ message: "Failed to retrieve essay" });
    }
};
exports.getEssayById = getEssayById;
// Update essay
const updateEssay = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, isPublished, tags } = req.body;
        // Ensure user is authenticated
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        const userId = req.user.id || req.user._id;
        const essay = await Essay_1.default.findById(id);
        if (!essay) {
            res.status(404).json({ message: "Essay not found" });
            return;
        }
        // Check if user is the author
        if (essay.author.toString() !== userId.toString()) {
            res.status(403).json({ message: "Not authorized to update this essay" });
            return;
        }
        // Update fields
        if (title)
            essay.title = title;
        if (content)
            essay.content = content;
        if (tags)
            essay.tags = tags;
        if (isPublished !== undefined)
            essay.isPublished = isPublished;
        await essay.save();
        res.status(200).json({
            message: "Essay updated successfully",
            essay: {
                id: essay._id,
                title: essay.title,
                content: essay.content,
                isPublished: essay.isPublished,
                tags: essay.tags,
            },
        });
    }
    catch (error) {
        console.error("Update essay error:", error);
        res.status(500).json({ message: "Failed to update essay" });
    }
};
exports.updateEssay = updateEssay;
// Delete essay
const deleteEssay = async (req, res) => {
    try {
        const { id } = req.params;
        // Ensure user is authenticated
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        const userId = req.user.id || req.user._id;
        const essay = await Essay_1.default.findById(id);
        if (!essay) {
            res.status(404).json({ message: "Essay not found" });
            return;
        }
        // Check if user is the author
        if (essay.author.toString() !== userId.toString()) {
            res.status(403).json({ message: "Not authorized to delete this essay" });
            return;
        }
        await Essay_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: "Essay deleted successfully" });
    }
    catch (error) {
        console.error("Delete essay error:", error);
        res.status(500).json({ message: "Failed to delete essay" });
    }
};
exports.deleteEssay = deleteEssay;
// Create HTML essay
const createHtmlEssay = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        if (!content || !title) {
            res.status(400).json({ message: "Content and title are required" });
            return;
        }
        // Transform the content to match the expected format
        const contentData = {
            title,
            ...content.sections.reduce((acc, section, index) => {
                const sectionNum = index + 1;
                return {
                    ...acc,
                    [`section${sectionNum}`]: section.content,
                    [`section${sectionNum}_image_url`]: section.selected_image_url || section.background_image
                };
            }, {})
        };
        // Generate HTML from the template
        const templatePath = path_1.default.join(__dirname, "../utils/template.html");
        const htmlContent = (0, replace_1.generateHtmlFromTemplate)(contentData, templatePath);
        // Create new essay with HTML content
        const essay = await Essay_1.default.create({
            title,
            content: JSON.stringify(content), // Store the raw content as JSON string
            htmlContent, // Store the generated HTML
            author: req.user.id || req.user._id,
            isPublished: true, // Set as published by default for HTML essays
            tags: ["html-essay"],
        });
        res.status(201).json({
            success: true,
            message: "HTML essay created successfully",
            essayId: essay._id,
            viewUrl: `/api/essays/${essay._id}/render`, // URL to view the rendered HTML
        });
    }
    catch (error) {
        console.error("Create HTML essay error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create HTML essay"
        });
    }
};
exports.createHtmlEssay = createHtmlEssay;
// Render HTML essay by ID
const renderEssayById = async (req, res) => {
    try {
        const { id } = req.params;
        const essay = await Essay_1.default.findById(id);
        if (!essay) {
            res.status(404).json({ message: "Essay not found" });
            return;
        }
        if (!essay.htmlContent) {
            res.status(404).json({ message: "HTML content not found for this essay" });
            return;
        }
        // Increment view count
        essay.views += 1;
        await essay.save();
        // Send HTML directly
        res.setHeader("Content-Type", "text/html");
        res.send(essay.htmlContent);
    }
    catch (error) {
        console.error("Render essay error:", error);
        res.status(500).json({ message: "Failed to render essay" });
    }
};
exports.renderEssayById = renderEssayById;

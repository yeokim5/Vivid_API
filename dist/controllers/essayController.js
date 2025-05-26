"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementEssayViews = exports.getAllPublishedEssays = exports.renderEssayById = exports.createHtmlEssay = exports.deleteEssay = exports.updateEssay = exports.getEssayById = exports.getUserEssays = exports.createEssay = void 0;
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
        const { title, subtitle, header_background_image, content, youtubeVideoCode } = req.body;
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
            subtitle: subtitle || "",
            header_background_image: header_background_image || "",
            youtubeVideoCode: youtubeVideoCode || "",
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
        // Save the generated HTML content
        const essay = await Essay_1.default.create({
            title,
            subtitle: subtitle || "",
            header_background_image: header_background_image || "",
            content: JSON.stringify(content),
            author: req.user.id || req.user._id,
            tags: [],
            htmlContent,
            youtubeVideoCode: youtubeVideoCode || "",
            isPublished: true
        });
        res.status(201).json({
            success: true,
            message: "HTML essay created successfully",
            essayId: essay._id,
            viewUrl: `/essay/${essay._id}`,
            essay: {
                id: essay._id,
                title: essay.title,
                subtitle: essay.subtitle,
                header_background_image: essay.header_background_image,
                content: essay.content,
                tags: essay.tags,
                isPublished: essay.isPublished
            },
        });
    }
    catch (error) {
        console.error("Create HTML essay error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create HTML essay",
            error: error instanceof Error ? error.message : "Unknown error"
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
        let htmlContent = essay.htmlContent;
        // If htmlContent doesn't exist, generate it from the content
        if (!htmlContent) {
            try {
                const contentData = {
                    title: essay.title,
                    youtubeVideoCode: essay.youtubeVideoCode || "",
                    ...JSON.parse(essay.content).sections.reduce((acc, section, index) => {
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
                htmlContent = (0, replace_1.generateHtmlFromTemplate)(contentData, templatePath);
                // Save the generated HTML content
                essay.htmlContent = htmlContent;
                await essay.save();
            }
            catch (error) {
                console.error("Error generating HTML content:", error);
                res.status(500).json({ message: "Failed to generate HTML content" });
                return;
            }
        }
        // Set Content Security Policy headers
        res.setHeader("Content-Security-Policy", "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "img-src 'self' data: https: blob: https://assets.lummi.ai https://images.stockcake.com https://*.stockcake.com; " +
            "connect-src 'self' https://api.unsplash.com https://assets.lummi.ai https://fonts.googleapis.com https://fonts.gstatic.com; " +
            "font-src 'self' data: https: https://fonts.gstatic.com; " +
            "object-src 'none'; " +
            "media-src 'self'; " +
            "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com;");
        // Send HTML directly
        res.setHeader("Content-Type", "text/html");
        res.send(htmlContent);
    }
    catch (error) {
        console.error("Render essay error:", error);
        res.status(500).json({ message: "Failed to render essay" });
    }
};
exports.renderEssayById = renderEssayById;
// Get all published essays
const getAllPublishedEssays = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'latest';
        let sortQuery = {};
        if (sortBy === 'latest') {
            sortQuery = { createdAt: -1 };
        }
        else if (sortBy === 'popular') {
            sortQuery = { views: -1 };
        }
        const [essays, total] = await Promise.all([
            Essay_1.default.find({})
                .sort(sortQuery)
                .select('title subtitle header_background_image author views createdAt tags isPublished')
                .populate('author', 'name')
                .skip(skip)
                .limit(limit),
            Essay_1.default.countDocuments({})
        ]);
        res.status(200).json({
            essays,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalEssays: total
        });
    }
    catch (error) {
        console.error("Get all essays error:", error);
        res.status(500).json({ message: "Failed to retrieve essays" });
    }
};
exports.getAllPublishedEssays = getAllPublishedEssays;
// Increment essay view count
const incrementEssayViews = async (req, res) => {
    try {
        const { id } = req.params;
        const essay = await Essay_1.default.findById(id);
        if (!essay) {
            res.status(404).json({ message: "Essay not found" });
            return;
        }
        // Only increment for published essays
        if (essay.isPublished) {
            essay.views += 1;
            await essay.save();
        }
        res.status(200).json({ views: essay.views });
    }
    catch (error) {
        console.error("Increment views error:", error);
        res.status(500).json({ message: "Failed to increment views" });
    }
};
exports.incrementEssayViews = incrementEssayViews;

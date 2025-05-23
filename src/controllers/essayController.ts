import { Request, Response } from "express";
import Essay, { IEssay } from "../models/Essay";
import { AuthRequest } from "../types";
import path from "path";
import { generateHtmlFromTemplate } from "../utils/replace";

// Create a new essay
export const createEssay = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
    const essay = await Essay.create({
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
  } catch (error) {
    console.error("Create essay error:", error);
    res.status(500).json({ message: "Failed to create essay" });
  }
};

// Get all essays for a user
export const getUserEssays = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const userId = req.user.id || req.user._id;

    const essays = await Essay.find({ author: userId })
      .sort({ createdAt: -1 })
      .select("title createdAt isPublished views tags");

    res.status(200).json({ essays });
  } catch (error) {
    console.error("Get user essays error:", error);
    res.status(500).json({ message: "Failed to retrieve essays" });
  }
};

// Get essay by ID
export const getEssayById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const essay = await Essay.findById(id);

    if (!essay) {
      res.status(404).json({ message: "Essay not found" });
      return;
    }

    res.status(200).json({ essay });
  } catch (error) {
    console.error("Get essay error:", error);
    res.status(500).json({ message: "Failed to retrieve essay" });
  }
};

// Update essay
export const updateEssay = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, isPublished, tags } = req.body;

    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const userId = req.user.id || req.user._id;

    const essay = await Essay.findById(id);

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
    if (title) essay.title = title;
    if (content) essay.content = content;
    if (tags) essay.tags = tags;
    if (isPublished !== undefined) essay.isPublished = isPublished;

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
  } catch (error) {
    console.error("Update essay error:", error);
    res.status(500).json({ message: "Failed to update essay" });
  }
};

// Delete essay
export const deleteEssay = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const userId = req.user.id || req.user._id;

    const essay = await Essay.findById(id);

    if (!essay) {
      res.status(404).json({ message: "Essay not found" });
      return;
    }

    // Check if user is the author
    if (essay.author.toString() !== userId.toString()) {
      res.status(403).json({ message: "Not authorized to delete this essay" });
      return;
    }

    await Essay.findByIdAndDelete(id);

    res.status(200).json({ message: "Essay deleted successfully" });
  } catch (error) {
    console.error("Delete essay error:", error);
    res.status(500).json({ message: "Failed to delete essay" });
  }
};

// Create HTML essay
export const createHtmlEssay = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, subtitle, header_background_image, content } = req.body;

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
      ...content.sections.reduce((acc: any, section: any, index: number) => {
        const sectionNum = index + 1;
        return {
          ...acc,
          [`section${sectionNum}`]: section.content,
          [`section${sectionNum}_image_url`]: section.selected_image_url || section.background_image
        };
      }, {})
    };

    // Generate HTML from the template
    const templatePath = path.join(__dirname, "../utils/template.html");
    const htmlContent = generateHtmlFromTemplate(contentData, templatePath);

    // Create new essay with HTML content
    const essay = await Essay.create({
      title,
      subtitle: subtitle || "",
      header_background_image: header_background_image || "",
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
  } catch (error) {
    console.error("Create HTML essay error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create HTML essay" 
    });
  }
};

// Render HTML essay by ID
export const renderEssayById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const essay = await Essay.findById(id);

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
          ...JSON.parse(essay.content).sections.reduce((acc: any, section: any, index: number) => {
            const sectionNum = index + 1;
            return {
              ...acc,
              [`section${sectionNum}`]: section.content,
              [`section${sectionNum}_image_url`]: section.selected_image_url || section.background_image
            };
          }, {})
        };

        // Generate HTML from the template
        const templatePath = path.join(__dirname, "../utils/template.html");
        htmlContent = generateHtmlFromTemplate(contentData, templatePath);

        // Save the generated HTML content
        essay.htmlContent = htmlContent;
        await essay.save();
      } catch (error) {
        console.error("Error generating HTML content:", error);
        res.status(500).json({ message: "Failed to generate HTML content" });
        return;
      }
    }

    // Set Content Security Policy headers
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https: blob: https://assets.lummi.ai https://images.stockcake.com https://*.stockcake.com; " +
      "connect-src 'self' https://api.unsplash.com https://assets.lummi.ai https://fonts.googleapis.com https://fonts.gstatic.com; " +
      "font-src 'self' data: https: https://fonts.gstatic.com; " +
      "object-src 'none'; " +
      "media-src 'self'; " +
      "frame-src 'self';"
    );
    
    // Send HTML directly
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    console.error("Render essay error:", error);
    res.status(500).json({ message: "Failed to render essay" });
  }
};

// Get all published essays
export const getAllPublishedEssays = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const essays = await Essay.find({ isPublished: true })
      .sort({ views: -1 })
      .select('title subtitle header_background_image author views createdAt')
      .populate('author', 'name');

    res.status(200).json(essays);
  } catch (error) {
    console.error("Get all essays error:", error);
    res.status(500).json({ message: "Failed to retrieve essays" });
  }
};

// Increment essay view count
export const incrementEssayViews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const essay = await Essay.findById(id);

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
  } catch (error) {
    console.error("Increment views error:", error);
    res.status(500).json({ message: "Failed to increment views" });
  }
};

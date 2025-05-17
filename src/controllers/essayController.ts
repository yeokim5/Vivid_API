import { Request, Response } from "express";
import Essay, { IEssay } from "../models/Essay";
import { AuthRequest } from "../types";

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

    // Increment view count for published essays
    if (essay.isPublished) {
      essay.views += 1;
      await essay.save();
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

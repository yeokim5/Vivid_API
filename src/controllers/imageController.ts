import { Request, Response } from "express";
import { getImageUrls, cleanup } from "../utils/image_getter";

// Cache to store ongoing image fetches
const ongoingFetches: Map<string, Promise<any>> = new Map();

// Handle cleanup on server shutdown
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

export const searchImages = async (req: Request, res: Response) => {
  try {
    const { prompt, maxImages, sectionId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    // If this is a sequential fetch request
    if (sectionId) {
      const cacheKey = `${prompt}_${sectionId}`;
      
      // If there's already a fetch in progress for this section, return it
      if (ongoingFetches.has(cacheKey)) {
        const result = await ongoingFetches.get(cacheKey);
        ongoingFetches.delete(cacheKey);
        return res.json(result);
      }

      // Start a new fetch and store it in the cache
      const fetchPromise = getImageUrls(prompt, maxImages || 10);
      ongoingFetches.set(cacheKey, fetchPromise);
      
      const result = await fetchPromise;
      ongoingFetches.delete(cacheKey);
      return res.json(result);
    }

    // Regular fetch
    const result = await getImageUrls(prompt, maxImages || 10);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Image search error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
      error: errorMessage,
    });
  }
};

export const processBackgroundImageSuggestions = async (
  req: Request,
  res: Response
) => {
  try {
    const { suggestions } = req.body;

    if (!suggestions || !Object.keys(suggestions).length) {
      return res.status(400).json({
        success: false,
        message: "Background image suggestions are required",
      });
    }

    const results: Record<string, any> = {};
    const suggestionsEntries = Object.entries(suggestions);

    // Process each suggestion one by one
    for (const [key, prompt] of suggestionsEntries) {
      if (typeof prompt === "string") {
        console.log(`Processing suggestion for ${key}: "${prompt}"`);
        const result = await getImageUrls(prompt, 10);
        results[key] = {
          prompt,
          ...result,
        };
      }
    }

    return res.json({
      success: true,
      message: `Processed ${
        Object.keys(results).length
      } background image suggestions`,
      data: results,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Background image processing error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
      error: errorMessage,
    });
  }
};

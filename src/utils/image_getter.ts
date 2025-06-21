import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export interface ImageSearchResult {
  success: boolean;
  message: string;
  urls: string[];
}

export interface ImageSearchRequest {
  prompt: string;
  maxImages?: number;
}

const LUMMI_API_KEY = process.env.LUMMI_API_KEY;
const LUMMI_API_URL = "https://api.lummi.ai/v1/images/search";

export async function getImageUrls(
  prompt: string,
  maxImages: number = 1
): Promise<ImageSearchResult> {
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
    const url = `${LUMMI_API_URL}?query=${encodeURIComponent(
      prompt
    )}&perPage=${maxImages}&free=true`;

    const response = await axios.get(LUMMI_API_URL, {
      headers: {
        Authorization: `Bearer ${LUMMI_API_KEY}`,
      },
      params,
    });
    const data = response.data;
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      // Return the image URLs (use .url property)
      const urls = data.data.map((img: any) => img.url).filter(Boolean);

      return {
        success: true,
        message: `Found ${urls.length} image URLs from Lummi API`,
        urls,
      };
    } else {
      return {
        success: true,
        message: "No images found",
        urls: [],
      };
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Unknown error";
    return {
      success: false,
      message: errorMessage,
      urls: [],
    };
  }
}

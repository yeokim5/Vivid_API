"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBackgroundImages = generateBackgroundImages;
const openai_1 = __importDefault(require("openai"));
// Initialize the OpenAI client with API key
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function generateBackgroundImages(inputData) {
    try {
        // Default content if no input is provided
        let content = {
            title: `Title.`,
            sections: {},
        };
        // Use the provided input data if available
        if (inputData) {
            content = inputData;
        }
        // Create input string for GPT with all sections
        let sectionsInput = "";
        Object.entries(content.sections).forEach(([key, value]) => {
            sectionsInput += `${key}: ${value}\n\n`;
        });
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an assistant that suggests appropriate background images for content sections and generates a subtitle for the essay. Return your suggestions in JSON format only.",
                },
                {
                    role: "user",
                    content: `For the following essay, first generate a compelling subtitle that captures the essence of the content, and then suggest appropriate background images for each section.\n\nTitle: ${content.title}\n\n${sectionsInput}\n\nFormat your response as a valid JSON object like this:\n{\n  \"subtitle\": \"A compelling subtitle that captures the essence of the essay\",\n  \"section_1_background_image\": \"description of appropriate background image\",\n  \"section_2_background_image\": \"description of appropriate background image\",\n  ...and so on for all sections\n}\n\nOnly return the JSON object, nothing else.`,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: "json_object" },
        });
        // Parse the JSON response
        const backgroundImagesJSON = response.choices[0].message.content || "{}";
        console.log("\n=== Background Image Suggestions ===\n");
        console.log(backgroundImagesJSON);
        // Parse and clean the response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(backgroundImagesJSON);
            // Remove quotes from all values
            Object.keys(parsedResponse).forEach((key) => {
                if (typeof parsedResponse[key] === "string") {
                    parsedResponse[key] = parsedResponse[key].replace(/^"|"$/g, "");
                }
            });
            return parsedResponse;
        }
        catch (e) {
            console.error("Error parsing background images:", e);
            return JSON.stringify({ error: "Failed to generate background images" });
        }
    }
    catch (error) {
        console.error("Error:", error);
        return JSON.stringify({ error: "Failed to generate background images" });
    }
}
exports.default = generateBackgroundImages;

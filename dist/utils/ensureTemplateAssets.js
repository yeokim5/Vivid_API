"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTemplateAssets = ensureTemplateAssets;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Ensures that the necessary directories for template assets exist
 */
function ensureTemplateAssets() {
    const frontPublicPath = path_1.default.join(__dirname, "../../../front/public");
    const stylesPath = path_1.default.join(frontPublicPath, "styles");
    const jsPath = path_1.default.join(frontPublicPath, "js");
    // Create directories if they don't exist
    if (!fs_1.default.existsSync(frontPublicPath)) {
        // console.log('Creating front/public directory');
        fs_1.default.mkdirSync(frontPublicPath, { recursive: true });
    }
    if (!fs_1.default.existsSync(stylesPath)) {
        // console.log("Creating front/public/styles directory");
        fs_1.default.mkdirSync(stylesPath, { recursive: true });
    }
    if (!fs_1.default.existsSync(jsPath)) {
        // console.log("Creating front/public/js directory");
        fs_1.default.mkdirSync(jsPath, { recursive: true });
    }
    // Check if the CSS file exists
    const cssFilePath = path_1.default.join(stylesPath, "essay-template.css");
    if (!fs_1.default.existsSync(cssFilePath)) {
        // console.warn("Warning: CSS file does not exist at", cssFilePath);
        // console.warn("Please create this file with the essay template styles");
    }
    // Check if the JS file exists
    const jsFilePath = path_1.default.join(jsPath, "essay-template.js");
    if (!fs_1.default.existsSync(jsFilePath)) {
        // console.warn("Warning: JavaScript file does not exist at", jsFilePath);
        // console.warn("Please create this file with the essay template scripts");
    }
}
exports.default = ensureTemplateAssets;

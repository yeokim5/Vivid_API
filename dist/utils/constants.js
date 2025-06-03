"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.API_ROUTES = exports.VIEW_EXPIRY = exports.DEFAULT_STYLES = void 0;
exports.DEFAULT_STYLES = {
    titleColor: "#f8f9fa",
    textColor: "#f8f9fa",
    fontFamily: "Playfair Display",
    boxBgColor: "#585858",
    boxOpacity: 0.5,
    backgroundEffect: "none"
};
exports.VIEW_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
exports.API_ROUTES = {
    ESSAYS: {
        BASE: "/api/essays",
        RENDER: (id) => `/api/essays/${id}/render`,
        VIEW: (id) => `/api/essays/${id}/view`
    }
};
exports.ERROR_MESSAGES = {
    NOT_AUTHENTICATED: "Not authenticated",
    NOT_AUTHORIZED: "Not authorized to perform this action",
    ESSAY_NOT_FOUND: "Essay not found",
    INVALID_CONTENT: "Content and title are required",
    GENERATION_FAILED: "Failed to generate HTML content",
    RENDER_FAILED: "Failed to render essay"
};

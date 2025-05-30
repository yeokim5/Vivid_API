export const DEFAULT_STYLES = {
  titleColor: "#f8f9fa",
  textColor: "#f8f9fa",
  fontFamily: "Playfair Display",
  boxBgColor: "#585858",
  boxOpacity: 0.5,
  backgroundEffect: "none"
} as const;

export const VIEW_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const API_ROUTES = {
  ESSAYS: {
    BASE: "/api/essays",
    RENDER: (id: string) => `/api/essays/${id}/render`,
    VIEW: (id: string) => `/api/essays/${id}/view`
  }
} as const;

export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: "Not authenticated",
  NOT_AUTHORIZED: "Not authorized to perform this action",
  ESSAY_NOT_FOUND: "Essay not found",
  INVALID_CONTENT: "Content and title are required",
  GENERATION_FAILED: "Failed to generate HTML content",
  RENDER_FAILED: "Failed to render essay"
} as const; 
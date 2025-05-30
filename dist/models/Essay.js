"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const EssaySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        default: "",
    },
    header_background_image: {
        type: String,
        default: "",
    },
    content: {
        type: String,
        required: true,
    },
    htmlContent: {
        type: String,
        default: null,
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    views: {
        type: Number,
        default: 0,
    },
    tags: [
        {
            type: String,
        },
    ],
    youtubeVideoCode: {
        type: String,
        default: "",
    },
    titleColor: {
        type: String,
        default: "#f8f9fa",
    },
    textColor: {
        type: String,
        default: "#f8f9fa",
    },
    fontFamily: {
        type: String,
        default: "Playfair Display",
    },
    backgroundEffect: {
        type: String,
        default: "none",
    },
    boxBgColor: {
        type: String,
        default: "#585858",
    },
    boxOpacity: {
        type: Number,
        default: 0.5,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Essay", EssaySchema);

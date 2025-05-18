"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = __importDefault(require("../models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("=============== PASSPORT CONFIG ===============");
console.log("Passport config - Google Client ID:", process.env.GOOGLE_CLIENT_ID
    ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "..."
    : "undefined");
console.log("Passport config - Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "***" : "undefined");
console.log("Passport config - Callback URL:", "/api/auth/google/callback");
// Configure Passport Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: "/api/auth/google/callback",
    scope: ["profile", "email"],
}, async (accessToken, refreshToken, profile, done) => {
    console.log("Google strategy callback triggered");
    try {
        // Find if user already exists
        let user = await User_1.default.findOne({ googleId: profile.id });
        if (user) {
            console.log("Existing user found:", user.email);
            // Update last login time
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }
        // Create new user if doesn't exist
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : "";
        console.log("Creating new user with email:", email);
        user = await User_1.default.create({
            googleId: profile.id,
            email,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            profilePicture,
        });
        return done(null, user);
    }
    catch (error) {
        console.error("Error in Google strategy callback:", error);
        return done(error, undefined);
    }
}));
// Serialize user for the session
passport_1.default.serializeUser((user, done) => {
    console.log("Serializing user:", user._id);
    done(null, user._id);
});
// Deserialize user from the session
passport_1.default.deserializeUser(async (id, done) => {
    console.log("Deserializing user:", id);
    try {
        const user = await User_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        console.error("Error deserializing user:", error);
        done(error, null);
    }
});
console.log("Passport configuration complete");
console.log("=======================================");
exports.default = passport_1.default;

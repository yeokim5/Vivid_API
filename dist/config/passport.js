"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = __importDefault(require("../models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
const Activity_1 = __importDefault(require("../models/Activity"));
dotenv_1.default.config();
// Configure Passport Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: "/api/auth/google/callback",
    scope: ["profile", "email"],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Extract user info from profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : "";
        // Find if user already exists by googleId or email
        let user = await User_1.default.findOne({
            $or: [{ googleId: profile.id }, { email }],
        });
        let isNewUser = false;
        if (user) {
            // Update existing user with Google ID and other info if needed
            user.googleId = profile.id;
            if (!user.profilePicture && profilePicture) {
                user.profilePicture = profilePicture;
            }
            if (!user.firstName && firstName) {
                user.firstName = firstName;
            }
            if (!user.lastName && lastName) {
                user.lastName = lastName;
            }
            // Update last login time
            user.lastLogin = new Date();
            await user.save();
            return done(null, { user, isNewUser: false });
        }
        // Create new user if doesn't exist
        try {
            user = await User_1.default.create({
                googleId: profile.id,
                email,
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                profilePicture,
            });
            // Log user registration activity
            await Activity_1.default.create({
                userId: user._id,
                action: "user_registered",
                details: {
                    email: user.email,
                    name: user.name,
                    registrationMethod: "google_oauth",
                },
            });
            return done(null, { user, isNewUser: true });
        }
        catch (error) {
            // If duplicate key error, try to find the user again
            if (error.code === 11000 && error.keyPattern?.email) {
                user = await User_1.default.findOne({ email });
                if (user) {
                    // Update the existing user with Google ID
                    user.googleId = profile.id;
                    if (!user.profilePicture && profilePicture) {
                        user.profilePicture = profilePicture;
                    }
                    user.lastLogin = new Date();
                    await user.save();
                    return done(null, { user, isNewUser: false });
                }
            }
            // Re-throw the error if it's not a duplicate key error or user not found
            throw error;
        }
    }
    catch (error) {
        console.error("Error in Google strategy callback:", error);
        return done(error, undefined);
    }
}));
// Serialize user for the session
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
// Deserialize user from the session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        console.error("Error deserializing user:", error);
        done(error, null);
    }
});
exports.default = passport_1.default;

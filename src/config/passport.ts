import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User, { IUser } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

console.log("=============== PASSPORT CONFIG ===============");
console.log(
  "Passport config - Google Client ID:",
  process.env.GOOGLE_CLIENT_ID
    ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "..."
    : "undefined"
);
console.log(
  "Passport config - Google Client Secret:",
  process.env.GOOGLE_CLIENT_SECRET ? "***" : "undefined"
);
console.log("Passport config - Callback URL:", "/api/auth/google/callback");

// Configure Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google strategy callback triggered");
      try {
        // Find if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log("Existing user found:", user.email);
          // Update last login time
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user if doesn't exist
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profilePicture =
          profile.photos && profile.photos[0] ? profile.photos[0].value : "";

        console.log("Creating new user with email:", email);
        user = await User.create({
          googleId: profile.id,
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          profilePicture,
        });

        return done(null, user);
      } catch (error) {
        console.error("Error in Google strategy callback:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: Express.User, done) => {
  console.log("Serializing user:", (user as IUser)._id);
  done(null, (user as IUser)._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  console.log("Deserializing user:", id);
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error, null);
  }
});

console.log("Passport configuration complete");
console.log("=======================================");

export default passport;

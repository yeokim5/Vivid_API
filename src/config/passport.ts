import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User, { IUser } from "../models/User";
import dotenv from "dotenv";
import Activity from "../models/Activity";

dotenv.config();

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
      try {
        // Extract user info from profile
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profilePicture =
          profile.photos && profile.photos[0] ? profile.photos[0].value : "";

        // Find if user already exists by googleId or email
        let user = await User.findOne({
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
          user = await User.create({
            googleId: profile.id,
            email,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            profilePicture,
          });

          // Log user registration activity
          await Activity.create({
            userId: user._id,
            action: "user_registered",
            details: {
              email: user.email,
              name: user.name,
              registrationMethod: "google_oauth",
            },
          });

          return done(null, { user, isNewUser: true });
        } catch (error: any) {
          // If duplicate key error, try to find the user again
          if (error.code === 11000 && error.keyPattern?.email) {
            user = await User.findOne({ email });
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
      } catch (error) {
        console.error("Error in Google strategy callback:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as IUser)._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error, null);
  }
});

export default passport;

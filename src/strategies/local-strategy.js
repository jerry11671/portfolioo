const passport = require("passport");

const {Strategy} = require("passport-local");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcrypt");

const {userModel} = require("../models");

const JWT_SECRET = process.env.SECRET_KEY;

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser(async (id, done) => {
	try {
		const find_user = await userModel.findOne({email: id});
		done(null, find_user);
	} catch (err) {
		done(err, null);
	}
});

passport.use(
  new Strategy(
    {
      usernameField: "id",
      passwordField: "password",
    },
    async (id, password, done) => {
      try {
        const user = await userModel.findOne({ email: id }).select("+password");

        if (!user) {
          return done(null, false, { message: "Incorrect login credentials, try again." });
        }

        const is_password_correct = bcrypt.compareSync(password, user.password);
  
        if (!is_password_correct) {
          return done(null, false, { message: "Incorrect login credentials, try again." });
        }

        if (!user.status) {
          return done(null, false, { message: "Account restricted. Please contact support." });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await userModel.findOne({ email: payload.currentUser.email });
        return done(null, user || false);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
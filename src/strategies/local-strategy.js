const passport = require("passport");

const {Strategy} = require("passport-local");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

const authLib = () => require("../lib/auths");

const userLib = () => require("../lib/users");

const {userModel} = require("../models");

const JWT_SECRET = process.env.SECRET_KEY;


passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser(async (id, done) => {
	try {
		const find_user = await userLib().readSingle({user_id: id});
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
      passReqToCallback: true,
    },
    async (req, id, password, done) => {
      try {
        const params = req.body;

        const { user, token } = await authLib().login(params);

        user["token"] = token;
        require("../logger").error(token);
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
    async (jwtPayload, done) => {
      try {
        const user = await userModel.findById(jwtPayload._id);
        return done(null, user || false);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
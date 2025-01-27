const jwt = require("jsonwebtoken");

const SECRET_KEY = `${process.env.SECRET_KEY}`;
const verifyCAPTCHA = require("../thirdParty/reCAPTCHA");
const environment = process.env.NODE_ENV;
const { AppError } = require("./error");
const { userModel, adminModel } = require("../models");
const { verifySession, rateLimiter } = require("../thirdParty/redis");

const modelsMap = {
  admin: adminModel,
  user: userModel,
};

// use request header [Auth] to get token
// use jwt to decode user
const getCurrentUser = async (req) => {
  let token = req.headers["authorization"] || req.headers["x-access-token"];
  if (token && token.startsWith("Bearer")) token = token.slice(7);

  if (!token) {
    throw new AppError(401, "Please login.");
  }

  let decode;

  try {
    decode = jwt.verify(token, SECRET_KEY);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(440, "Session Expired.");
    }
  }

  if (decode) {
    decode = decode.currentUser;

    const session = await verifySession(decode._id, token);

    if (!session) {
      throw new AppError(440, "Session Expired.");
    }

    const Model = modelsMap[decode.type.toLowerCase()];

    const user = await Model.findById(decode._id);

    if (!user) {
      throw new AppError(404, "Please create an account.");
    }

    if (!user.status) {
      throw new AppError(403, "Account restricted.");
    }

    return {
      _id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      status: user.status,
      type: user.type,
      role: user.role,
    };
  } else {
    throw new AppError(401, "Please login.");
  }
};

module.exports.validateGoogleRecaptchaToken = async (req, res, next) => {
  try {
    const params = req.body;

    if (environment == "production") {
      if (params.captcha_token) {
        const verify_captcha = await verifyCAPTCHA(params.captcha_token);

        if (!verify_captcha) {
          throw new AppError(
            401,
            "Unable to process information, please try again"
          );
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports.setAppParam = (req, res, next) => {
  try {
    const base_url = req.baseUrl.split("/");

    // the app name should be the third segment in /api/v1/{app}
    req.body.app = base_url[3];

    next();
  } catch (error) {
    next(error);
  }
};

module.exports.isRateLimited = async (req, res, next) => {
  try {
    // use the user ID if logged in, otherwise fallback to IP address
    const user_id = req.user.currentUser._id || req.ip;

    const request_allowed = await rateLimiter(user_id);

    if (!request_allowed) {
      throw new AppError(
        429,
        `Too many requests. Please wait ${process.env.REDIS_REQUEST_RATE_LIMIT_TIME_WINDOW} seconds and try again.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports.isLoggedIn = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);

    req.user = {
      currentUser: user,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports.isLoggedInAdmin = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);

    if (user.type !== "Admin") {
      throw new AppError(403, "You are not allowed to perform this action.");
    }

    req.user = {
      currentUser: user,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports.isLoggedInSuperAdmin = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);

    if (user.type !== "Admin" || user.role !== "Super Admin") {
      throw new AppError(403, "You are not allowed to perform this action.");
    }

    req.user = {
      currentUser: user,
    };

    next();
  } catch (error) {
    next(error);
  }
};

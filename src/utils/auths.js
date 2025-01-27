const { sign } = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

const auths = {
  getToken(user) {
    return sign(
      {
        currentUser: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          status: user.status,
          type: user.type,
          role: user.role,
        },
      },
      SECRET_KEY,
      { expiresIn: "30d" }
    );
  },
};

module.exports = auths;

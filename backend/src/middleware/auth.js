const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwt");
const usersRepo = require("../repositories/users.repository");
async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await usersRepo.getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid session." });
    }

    req.user = usersRepo.toPublicUser(user);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired." });
    }
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

module.exports = auth;

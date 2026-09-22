const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const encoded = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(encoded, "askeJvascomaiordorio_$*pj1kdvm");
    const user = await UserModel.find(decoded.email);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = auth;

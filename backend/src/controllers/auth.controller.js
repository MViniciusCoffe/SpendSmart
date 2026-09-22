const AuthModel = require("../models/auth.model");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  const data = req.body;
  const user = await AuthModel.login(data.email, data.senha);

  if (!user) return res.status(401).json({ message: "Unauthorized" });
  try {
    const token = jwt.sign(
      { id: user.id, email: user.email },
      "askeJvascomaiordorio_$*pj1kdvm",
    );
    return res.json({ message: "Login feito com sucesso", token, user });
  } catch (error) {
    return res.status(401).json({ message: "Erro ao entrar", error });
  }
}

module.exports = { login };

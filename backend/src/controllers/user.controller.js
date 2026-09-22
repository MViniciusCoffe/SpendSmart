const UserModel = require("../models/user.model.js");

async function store(req, res) {
  const user = req.body;
  const userRepeat = await UserModel.check(user.email);
  if (userRepeat) {
    return res.status(400).json({ message: "Usuário já existe" });
  }
  await UserModel.save(
    user.nomeCompleto,
    user.email,
    user.senha,
    user.dataNascimento,
    user.telefone,
    new Date().toISOString(), // Gerar a data de criação do usuário (está no fuso-horário do Reino Unido (UTC/GMT +00:00))
  );
  res.json({ message: "Usuário Criado" });
}

async function remove(req, res) {
  const email = req.params.email;
  const user = await UserModel.find(email);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  await UserModel.delete(email);
  res.json({ message: "Usuário removido" });
}

async function update(req, res) {
  const email = req.params.email;
  const user = req.body;
  const userFind = await UserModel.find(email);
  if (!userFind) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  const updatedUser = await UserModel.update(email, user);
  res.json({ message: "Usuário Atualizado", updatedUser: updatedUser });
}

async function show(req, res) {
  res.json(await UserModel.show());
}

module.exports = { store, remove, update, show };

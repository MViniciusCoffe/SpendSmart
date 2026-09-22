const SpendModel = require("../models/spend.model.js");

async function show(req, res) {
  res.json(await SpendModel.show());
}

async function store(req, res) {
  const spend = req.body;

  await SpendModel.save(
    spend.nome,
    spend.categorySelected,
    spend.valor,
    spend.data,
    spend.descricao,
    spend.formaPagamento,
    spend.userId,
  );

  res.json({ message: "Despesa cadastrada com sucesso" });
}

async function remove(req, res) {
  const spendId = req.params.id;

  // Verifica se a receita existe para evitar bugs
  const spend = await SpendModel.find(spendId);
  if (!spend) {
    return res.status(404).json({ message: "Despesa não encontrada" });
  }

  await SpendModel.delete(spendId);
  res.json({ message: "Despesa excluída" });
}

module.exports = { show, store, remove };

const IncomeModel = require("../models/income.model.js");

async function show(req, res) {
  res.json(await IncomeModel.show());
}

async function store(req, res) {
  const income = req.body;

  await IncomeModel.save(
    income.categorySelected,
    income.userId,
    income.valor,
    income.fonteRenda,
    income.data,
    income.descricao,
    income.formaPagamento,
  );

  res.json({ message: "Renda cadastrada com sucesso" });
}

async function remove(req, res) {
  const incomeId = req.params.id;

  // Verifica se a receita existe para evitar bugs
  const income = await IncomeModel.find(incomeId);
  if (!income) {
    return res.status(404).json({ message: "Receita não encontrada" });
  }

  await IncomeModel.delete(incomeId);
  res.json({ message: "Receita excluída" });
}

module.exports = { show, store, remove };

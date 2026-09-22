const CategoryModel = require("../models/category.model.js");

async function show(req, res) {
  res.json(await CategoryModel.show());
}

async function store(req, res) {
  const category = req.body;

  // Só é permitido dois tipos de categorias: Receita e Despesa (ignora diferenças de maiúsculas/minúsculas).
  category.tipo = category.tipo.toLowerCase();

  const allowedTypes = ["receita", "despesa"];
  if (!allowedTypes.includes(category.tipo)) {
    return res.json({ message: "Tipo de Categoria inválido" });
  }

  // Verifica se a categoria já existe pelo nome (ignora diferenças de maiúsculas/minúsculas, só não ignora acentuação).
  category.nome = category.nome.toLowerCase();

  const catRepeat = await CategoryModel.check(
    category.nome,
    category.tipo,
    category.userId,
  );
  if (catRepeat[0]) {
    return res.status(400).json({ message: "Categoria já existe" });
  }
  await CategoryModel.save(
    category.nome,
    category.tipo,
    category.descricao,
    category.cor,
    category.userId,
  );
  res.json({ message: "Categoria Criada" });
}

async function remove(req, res) {
  const categoryId = req.params.id;
  const category = await CategoryModel.find(categoryId);
  if (!category) {
    return res.status(404).json({ message: "Categoria não encontrada" });
  }
  await CategoryModel.delete(categoryId);
  res.json({ message: "Categoria Excluída" });
}

async function update(req, res) {
  const categoryId = req.params.id;
  const category = req.body;

  // Verifica se a categoria existe
  const categoryExists = await CategoryModel.find(categoryId);

  // Só é permitido dois tipos de categorias: Receita e Despesa (ignora diferenças de maiúsculas/minúsculas).
  category.editTipo = category.editTipo.toLowerCase();

  const allowedTypes = ["receita", "despesa"];
  if (!allowedTypes.includes(category.editTipo)) {
    return res.json({ message: "Tipo de Categoria inválido" });
  }

  // Verifica se a categoria já existe pelo nome (ignora diferenças de maiúsculas/minúsculas, só não ignora acentuação).
  category.editNome = category.editNome.toLowerCase();

  const catRepeat = await CategoryModel.check(
    category.editNome,
    category.editTipo,
    category.userId,
  );

  // Garante que você não coloque o nome uma categoria igual a outra que não seja a que você esteja editando.
  if (catRepeat[0]) {
    if (catRepeat[1].id !== categoryExists.id) {
      return res.status(400).json({ message: "Categoria já existe" });
    }
  }

  const updatedCategory = await CategoryModel.update(categoryId, category);

  res.json({ message: "Categoria Atualizada", category: updatedCategory });
}

module.exports = { show, store, remove, update };

const categoryController = require("../controllers/category.controller");
const CategoryModel = require("../models/category.model.js");

jest.mock("../models/category.model.js");

describe("Testes do SpendSmart - Categorias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Deve rejeitar categoria com tipo inválido", async () => {
    const req = {
      body: {
        nome: "Salário",
        tipo: "invalido",
        descricao: "Categoria de teste",
        cor: "#000000",
        userId: 1,
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await categoryController.store(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Tipo de Categoria inválido",
    });
  });

  test("Deve criar uma categoria com tipo válido", async () => {
    const req = {
      body: {
        nome: "Salário",
        tipo: "receita",
        descricao: "Categoria de teste",
        cor: "#000000",
        userId: 1,
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    CategoryModel.check.mockResolvedValue([]);
    CategoryModel.save.mockResolvedValue();

    await categoryController.store(req, res);

    expect(CategoryModel.check).toHaveBeenCalled();
    expect(CategoryModel.save).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      message: "Categoria Criada",
    });
  });
});
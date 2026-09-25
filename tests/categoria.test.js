import axios from "axios";

import {
  buscarCategorias,
  criarCategoria,
  excluirCategoria,
  atualizarCategoria,
} from "../services/categoriaService";

jest.mock("axios");

describe("CRUD de Categoria - Testes Unitários", () => {
  const token = "token-teste";

  test("deve inserir uma categoria", async () => {
    const categoria = {
      nome: "Alimentação",
      tipo: "Despesa",
      descricao: "Gastos com alimentação",
      cor: "#FF0000",
      userId: 1,
    };

    const respostaMock = {
      data: {
        id: 1,
        ...categoria,
      },
    };

    axios.post.mockResolvedValue(respostaMock);

    const resultado = await criarCategoria(categoria, token);

    expect(axios.post).toHaveBeenCalledWith(
      "http://54.227.20.33:5000/category",
      JSON.stringify(categoria),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-teste",
        },
      }
    );

    expect(resultado.data).toEqual(respostaMock.data);
  });

  test("deve consultar as categorias", async () => {
    const respostaMock = {
      data: [
        {
          id: 1,
          nome: "Alimentação",
          tipo: "Despesa",
        },
        {
          id: 2,
          nome: "Salário",
          tipo: "Receita",
        },
      ],
    };

    axios.get.mockResolvedValue(respostaMock);

    const resultado = await buscarCategorias(token);

    expect(axios.get).toHaveBeenCalledWith(
      "http://54.227.20.33:5000/category",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-teste",
        },
      }
    );

    expect(resultado.data).toEqual(respostaMock.data);
  });

  test("deve atualizar uma categoria", async () => {
    const id = 1;

    const categoria = {
      editNome: "Alimentação atualizada",
      editTipo: "Despesa",
      editDescricao: "Descrição atualizada",
      editCor: "#00FF00",
      userId: 1,
    };

    const respostaMock = {
      data: {
        id,
        ...categoria,
      },
    };

    axios.put.mockResolvedValue(respostaMock);

    const resultado = await atualizarCategoria(
      id,
      categoria,
      token
    );

    expect(axios.put).toHaveBeenCalledWith(
      `http://54.227.20.33:5000/category/${id}`,
      JSON.stringify(categoria),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-teste",
        },
      }
    );

    expect(resultado.data).toEqual(respostaMock.data);
  });

  test("deve excluir uma categoria", async () => {
    const id = 1;

    const respostaMock = {
      data: {
        mensagem: "Categoria removida com sucesso",
      },
    };

    axios.delete.mockResolvedValue(respostaMock);

    const resultado = await excluirCategoria(id, token);

    expect(axios.delete).toHaveBeenCalledWith(
      `http://54.227.20.33:5000/category/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-teste",
        },
      }
    );

    expect(resultado.data).toEqual(respostaMock.data);
  });
});
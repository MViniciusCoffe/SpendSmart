import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import { buscarCategorias } from "../services/categoriaService";

describe("Integração - Categoria", () => {
  const mock = new MockAdapter(axios);

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test("deve integrar o serviço de categorias com o cliente HTTP", async () => {
    const categorias = [
      {
        id: 1,
        nome: "Alimentação",
        tipo: "Despesa",
      },
    ];

    mock
      .onGet("http://54.227.20.33:5000/category")
      .reply(200, categorias);

    const resultado = await buscarCategorias("token-teste");

    expect(resultado.status).toBe(200);
    expect(resultado.data).toEqual(categorias);
  });
});
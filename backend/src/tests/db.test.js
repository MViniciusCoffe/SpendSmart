const pool = require("../database");

describe("Teste de Conexão com o Banco de Dados", () => {
  describe("Conexão com o banco de dados", () => {
    afterAll(async () => {
      await pool.end();
    });

    test("Deve conectar ao banco de dados e retornar a hora atual", async () => {
      try {
        const result = await pool.query("SELECT NOW()");

        expect(result.rows).toBeDefined();
        expect(result.rows.length).toBeGreaterThan(0);

        console.log("Conexão bem sucedida! A hora atual é:", result.rows[0].now);
      } catch (error) {
        console.error("Erro ao conectar ao banco de dados:", error);
        throw error;
      }
    });
  });
});

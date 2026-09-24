import withAuth from "./components/utils/withAuth";
import Navbar from "../components/Navbar/navbarApp";
import styles from "./gastosPage.module.css";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

function gastosPage() {
  // Variáveis para salvar as Gastos
  const [valor, setValor] = useState(0.0);

  // Verificar se o valor é 0
  const checkValorIsZero = () => {
    if (valor != 0) {
      return true;
    } else {
      return false;
    }
  };

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState();
  const [formaPagamento, setFormaPagamento] = useState("");

  // Tipos de erros usados em cada "aba"
  const [addingErrorMessage, setAddingErrorMessage] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState("add");

  // Variáveis para categorias
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");

  // Recuperar informações do usuário
  const [userId, setUserId] = useState(null);
  const authToken = Cookies.get("authToken");

  // Ativa um gatilho
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Variáveis para as Gastos
  const [expenses, setExpenses] = useState([]);
  const [expenseSelected, setExpenseSelected] = useState("");
  const [expenseDetails, setExpenseDetails] = useState(null);

  useEffect(() => {
    const userId = JSON.parse(Cookies.get("user")).id;
    setUserId(userId);

    if (activeTab === "add") {
      const fetchCategorias = async () => {
        try {
          const response = await axios.get("http://54.227.20.33:5000/category", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer: ${authToken}`,
            },
          });

          // Filtrar categorias pelo usuário e pelo tipo "despesa"
          const categoriasFiltradas = response.data.filter(
            (categoria) =>
              categoria.usuario_id === userId && categoria.tipo === "despesa"
          );

          if (categoriasFiltradas.length <= 0) {
            alert(
              "Não existem categorias cadastradas como despesa, você precisa selecionar pelo menos uma categoria de despesa para adicionar despesas"
            );
          }

          setCategories(categoriasFiltradas);
          setDeleteErrorMessage("");
        } catch (error) {
          setDeleteErrorMessage("Houve um erro ao atualizar os dados");
        }
      };

      fetchCategorias();
    }

    if (activeTab === "delete") {
      const fetchGastos = async () => {
        try {
          const response = await axios.get("http://54.227.20.33:5000/spend", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer: ${authToken}`,
            },
          });

          // Filtrar Gastos pelo usuário
          const gastosFiltrados = response.data.filter(
            (gasto) => gasto.usuario_id === userId
          );

          setExpenses(gastosFiltrados);
          setDeleteErrorMessage("");
        } catch (error) {
          setDeleteErrorMessage("Houve um erro ao atualizar os dados");
        }
      };

      fetchGastos();
    }
    // toda as vezes que esses valores mudarem, o useEffect roda de novo
  }, [activeTab, authToken, updateTrigger]);

  // Função para salvar Despesas
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://54.227.20.33:5000/spend",
        JSON.stringify({
          categorySelected,
          userId,
          valor,
          nome,
          data,
          descricao,
          formaPagamento,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        }
      );

      setAddingErrorMessage("");
      alert("Gasto adicionada com Sucesso");
    } catch (error) {
      if (!error?.response) {
        setAddingErrorMessage("Erro ao acessar o servidor.");
      } else {
        setAddingErrorMessage("Erro desconhecido ao atualizar os dados.");
      }
    }
  };

  // Função para deletar Gastos
  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.delete(
        `http://54.227.20.33:5000/spend/${expenseSelected}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        }
      );

      alert("Gasto removida com sucesso!");
      setDeleteErrorMessage("");

      // Roda o useEffect novamente, já que o valor de updateTrigger mudou
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      // Definir erro caso tente remover uma categoria que esteja sendo usada
      if (!error?.response) {
        setDeleteErrorMessage("Erro ao acessar o servidor");
      } else if (error.response.status == 404) {
        setDeleteErrorMessage("Gasto não encontrado");
      } else {
        setDeleteErrorMessage("Houve um erro desconhecido");
      }
    }
  };

  // Função para formatar o valor para o input
  const formatValor = () => {
    if (valor) {
      if (valor && !valor.includes(".")) {
        setValor(`${valor}.00`); // Adiciona ".00" caso não tenha
      } else if (valor.split(".")[1]?.length === 1) {
        setValor(`${valor}0`); // Adiciona "0" caso só tenha uma casa decimal
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.app_content}>
        <div className={styles.button_tabs}>
          {/* Botão de Adicionar */}
          <button
            className={`${styles.tab_button} ${
              activeTab === "add" ? styles.active_tab : ""
            }`}
            onClick={() => setActiveTab("add")}
          >
            Adicionar
          </button>

          {/* Botão de Deletar */}
          <button
            className={`${styles.tab_button} ${
              activeTab === "delete" ? styles.active_tab : ""
            }`}
            onClick={() => setActiveTab("delete")}
          >
            Excluir
          </button>
        </div>

        {/* Se o botão for "Adicionar" */}
        {activeTab === "add" && (
          <form className={styles.form_content} onSubmit={handleSave}>
            <h1 className={styles.content_h1}>Adicionar Despesa</h1>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="nome_despesa">
                Nome da Despesa
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="nome"
                value={nome}
                placeholder="Despesa"
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="valor">
                Valor
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="valor"
                value={valor}
                placeholder="Formato: $ 0.01"
                onChange={(e) => {
                  // Permite números com até 2 casas decimais
                  const regex = /^\d*(\.\d{0,2})?$/;
                  if (regex.test(e.target.value)) {
                    setValor(e.target.value); // Atualiza apenas valores válidos
                  }
                }}
                onBlur={formatValor}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.form_group_50}>
              <div className={styles.input_group}>
                <label className={styles.input_title} htmlFor="categoria">
                  Selecionar Categoria
                </label>
                <div className={styles.category_input_link}>
                  <select
                    className={styles.input_data_50}
                    id="categoria"
                    value={categorySelected}
                    onChange={(e) => {
                      setCategorySelected(Number(e.target.value));
                    }}
                  >
                    <option value="" disabled>
                      Selecionar
                    </option>

                    {/* Exibir as categorias dentro da tag <options> */}
                    {categories.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  <Link href="/categoriaPage" className={styles.category_link}>
                    +
                  </Link>
                </div>
              </div>

              <div className={styles.input_group}>
                <label className={styles.input_title} htmlFor="data">
                  Data da Transferência
                </label>
                <input
                  className={styles.input_data_50}
                  type="date"
                  id="data"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="descricao">
                Descrição
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="descricao"
                value={descricao}
                placeholder="Descrição (Opcional)"
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="forma_pagamento">
                Forma de Pagamento
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="forma_pagamento"
                value={formaPagamento}
                placeholder="Forma de pagamento (Opcional)"
                onChange={(e) => setFormaPagamento(e.target.value)}
              />
            </div>

            {addingErrorMessage && (
              <p className={styles.error_message}>{addingErrorMessage}</p>
            )}

            <div className={styles.button_group}>
              <button
                type="submit"
                className={styles.save_button}
                disabled={!categorySelected || !checkValorIsZero()}
              >
                Salvar Despesa
              </button>
            </div>
          </form>
        )}

        {/* Se o botão for "Deletar" */}
        {activeTab === "delete" && (
          <form className={styles.form_content} onSubmit={handleDelete}>
            <h1 className={styles.content_h1}>Excluir Despesa</h1>
            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="categoria">
                Selecionar Despesa
              </label>
              <select
                className={styles.input_data}
                id="despesa"
                value={expenseSelected}
                onChange={(e) => {
                  setExpenseSelected(Number(e.target.value));

                  // procura em (gastos) a que possui o mesmo id de (e.target.value)
                  const expense = expenses.find(
                    (expense) => expense.id === Number(e.target.value)
                  );

                  setExpenseDetails(expense || null);
                }}
              >
                <option value="" disabled>
                  Selecionar uma Despesa
                </option>

                {/* Exibir as categorias dentro da tag <options> */}
                {expenses.map((gasto) => (
                  <option key={gasto.id} value={gasto.id}>
                    {gasto.nome}
                  </option>
                ))}
              </select>

              {/* Exibir detalhes da categoria */}
              <div className={styles.category_details}>
                <h2>Detalhes da Despesa</h2>
                <p>
                  <strong>Nome da Despesa:</strong>{" "}
                  {expenseDetails?.nome || "Sem dados"}
                </p>
                <p>
                  <strong>Valor:</strong> {expenseDetails?.valor || "Sem dados"}
                </p>
                <p>
                  <strong>Descrição:</strong>{" "}
                  {expenseDetails?.descricao || "Nenhuma descrição fornecida."}
                </p>
                {/* Converte as datas para o formato AAAA-MM-DD */}
                <p>
                  <strong>Data da Transferência:</strong>{" "}
                  {expenseDetails?.data
                    ? new Date(expenseDetails.data).toISOString().split("T")[0]
                    : "Sem dados"}
                </p>
                <p>
                  <strong>Fora de Pagamento:</strong>{" "}
                  {expenseDetails?.forma_pagamento || "Sem dados"}
                </p>
              </div>
            </div>

            {deleteErrorMessage && (
              <p className={styles.error_message}>{deleteErrorMessage}</p>
            )}

            <div className={styles.button_group}>
              <button
                type="submit"
                className={styles.delete_button}
                disabled={!expenseSelected}
              >
                Excluir Despesa
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

export default withAuth(gastosPage);

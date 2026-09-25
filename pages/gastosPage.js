import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./gastosPage.module.css";
import withAuth from "../components/utils/withAuth";
import Navbar from "../components/Navbar/navbarApp";
import { transactionService } from "../services/transactionService";
import { categoryService } from "../services/categoryService";


function GastosPage() {
  // Variáveis para salvar as Gastos
  const [valor, setValor] = useState(0.0);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState();
  const [formaPagamento, setFormaPagamento] = useState("");

  // Verificar se o valor é válido
  const checkValorIsValid = () => {
    return parseFloat(valor) > 0;
  };

  // Tipos de erros usados em cada "aba"
  const [addingErrorMessage, setAddingErrorMessage] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState("add");

  // Variáveis para categorias e gastos
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expenseSelected, setExpenseSelected] = useState("");
  const [expenseDetails, setExpenseDetails] = useState(null);

  // Ativa o useEffect para atualizar a lista de categorias e gastos
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        // Filtra categorias por despesas
        const allCategories = await categoryService.getCategories();
        const expensesCategories = allCategories.filter((cat) => cat.tipo === 'despesa');
        setCategories(expensesCategories);

        if (expensesCategories.length === 0 && activeTab === "add") {
          alert("Não há categorias de despesa disponíveis. Por favor, adicione uma categoria antes de adicionar uma despesa.");
          // Substituir esses alerts depois
        }

        // Filtra transações por despesas
        const allTransactions = await transactionService.getTransactions();
        const expensesTransactions = allTransactions.filter((trans) => trans.tipo === 'despesa');
        setExpenses(expensesTransactions);

        setAddingErrorMessage("");
        setDeleteErrorMessage("");
      } catch (error) {
        console.error("Erro ao buscar categorias ou transações:", error);
      }
    }

    fetchDados();
  }, [updateTrigger]);

  // Função para salvar Despesas
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await transactionService.createTransaction({
        titulo: nome, // A tela usa nome, mas o serviço, titulo
        valor: parseFloat(valor),
        tipo: "despesa",
        categoria_id: categorySelected,
        data_ocorrencia: data,
        descricao: descricao,
        metodo_pagamento: formaPagamento,
      });

      setAddingErrorMessage("");
      alert("Gasto adicionada com sucesso!");

      // Limpa campos
      setNome("");
      setValor(0.0);
      setDescricao("");
      setData("");
      setFormaPagamento("");
      setCategorySelected("");

      // Roda o useEffect novamente, já que o valor de updateTrigger mudou
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      setAddingErrorMessage(error.message);
    }
  };

  // Função para deletar Gastos
  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      await transactionService.deleteTransaction(expenseSelected);

      setDeleteErrorMessage("");
      alert("Gasto excluída com sucesso!");

      setExpenseSelected("");
      setExpenseDetails(null);
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      setDeleteErrorMessage(error.message);
    }
  };

  // Função para formatar o valor para o input
  const formatValor = () => {
    if (valor) {
      const stringValor = String(valor);
      if (!stringValor.includes(".")) {
        setValor(`${stringValor}.00`);
      } else if (stringValor.split(".")[1]?.length === 1) {
        setValor(`${stringValor}0`);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.app_content}>
        <div className={styles.button_tabs}>
          <button
            className={`${styles.tab_button} ${activeTab === "add" ? styles.active_tab : ""}`}
            onClick={() => setActiveTab("add")}
          >
            Adicionar
          </button>
          <button
            className={`${styles.tab_button} ${activeTab === "delete" ? styles.active_tab : ""}`}
            onClick={() => setActiveTab("delete")}
          >
            Excluir
          </button>
        </div>

        {/* --- ABA ADICIONAR --- */}
        {activeTab === "add" && (
          <form className={styles.form_content} onSubmit={handleSave}>
            <h1 className={styles.content_h1}>Adicionar Despesa</h1>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="nome">
                Nome da Despesa
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="nome"
                value={nome}
                placeholder="Ex: Supermercado"
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
                placeholder="Ex: 150.00"
                onChange={(e) => {
                  const regex = /^\d*(\.\d{0,2})?$/;
                  if (regex.test(e.target.value)) {
                    setValor(e.target.value);
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
                    onChange={(e) => setCategorySelected(Number(e.target.value))}
                  >
                    <option value="" disabled>Selecionar</option>
                    {categories.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  <Link href="/categoriaPage" className={styles.category_link}>+</Link>
                </div>
              </div>

              <div className={styles.input_group}>
                <label className={styles.input_title} htmlFor="data">
                  Data da Despesa
                </label>
                <input
                  className={styles.input_data_50}
                  type="date"
                  id="data"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
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
                placeholder="Ex: Cartão de Crédito, Pix (Opcional)"
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
                disabled={!categorySelected || !checkValorIsValid() || !nome || !data}
              >
                Salvar Despesa
              </button>
            </div>
          </form>
        )}

        {/* --- ABA EXCLUIR --- */}
        {activeTab === "delete" && (
          <form className={styles.form_content} onSubmit={handleDelete}>
            <h1 className={styles.content_h1}>Excluir Despesa</h1>
            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="despesa">
                Selecionar Despesa
              </label>
              <select
                className={styles.input_data}
                id="despesa"
                value={expenseSelected}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  setExpenseSelected(selectedId);
                  const expense = expenses.find((exp) => exp.id === selectedId);
                  setExpenseDetails(expense || null);
                }}
              >
                <option value="" disabled>Selecionar uma Despesa</option>
                {expenses.map((gasto) => (
                  <option key={gasto.id} value={gasto.id}>
                    {gasto.titulo} {/* No serviço novo usamos titulo */}
                  </option>
                ))}
              </select>

              <div className={styles.category_details}>
                <h2>Detalhes da Despesa</h2>
                <p><strong>Nome:</strong> {expenseDetails?.titulo || "Sem dados"}</p>
                <p><strong>Valor:</strong> R$ {expenseDetails?.valor || "0.00"}</p>
                <p><strong>Descrição:</strong> {expenseDetails?.descricao || "Nenhuma descrição fornecida."}</p>
                <p>
                  <strong>Data:</strong>{" "}
                  {expenseDetails?.data
                    ? new Date(expenseDetails.data).toISOString().split("T")[0]
                    : "Sem dados"}
                </p>
                <p><strong>Forma de Pagamento:</strong> {expenseDetails?.forma_pagamento || "Sem dados"}</p>
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

export default withAuth(GastosPage);

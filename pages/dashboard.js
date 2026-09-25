import { useState, useEffect } from "react";
import withAuth from "../components/utils/withAuth";
import styles from "./dashboard.module.css";
import Navbar from "../components/Navbar/navbarApp.js";
import { supabase } from "../infra/supabase";
import { transactionService } from "../services/transactionService";
import { categoryService } from "../services/categoryService";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
);

function DashboardPage() {
  const [dados, setDados] = useState({
    saldo: 0,
    totalReceitas: 0,
    totalGastos: 0,
  });
  const [spends, setSpends] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [errorMessage, setErrorMessage] = useState("");

  // Buscar nome atualizado direto do banco (Resolve o bug do Cookie desatualizado)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome_completo")
            .eq("id", user.id)
            .single();

          if (profile?.nome_completo) {
            setNomeUsuario(profile.nome_completo);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Buscar Transações e Categorias usando os Services
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca todas as categorias
        const allCategories = await categoryService.getCategories();
        setCategories(allCategories);

        // 2. Busca todas as transações (Receitas e Gastos unificados)
        const allTransactions = await transactionService.getTransactions();

        // 3. Filtra localmente
        const fetchedIncomes = allTransactions.filter((t) => t.tipo === "receita");
        const fetchedSpends = allTransactions.filter((t) => t.tipo === "despesa");

        setIncomes(fetchedIncomes);
        setSpends(fetchedSpends);

        // 4. Calcula os totais e o saldo
        const totalReceitas = fetchedIncomes.reduce(
          (acc, item) => acc + parseFloat(item.valor || 0),
          0
        );

        const totalGastos = fetchedSpends.reduce(
          (acc, item) => acc + parseFloat(item.valor || 0),
          0
        );

        const saldo = totalReceitas - totalGastos;

        setDados({
          saldo,
          totalReceitas,
          totalGastos,
        });

        setErrorMessage("");
      } catch (error) {
        console.error("Erro no Dashboard:", error);
        setErrorMessage("Houve um erro ao atualizar os dados do dashboard.");
      }
    };

    fetchData();
  }, []);

  // Formatar valores para dinheiro em Real
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Montar o gráfico de despesas por categoria
  const expensesCategoryChart = () => {
    if (categories.length === 0 || dados.totalGastos === 0) return null;

    const despesasPorCategoria = categories.map((categoria) => {
      const valorTotalCategoria = spends
        .filter((gasto) => gasto.categoria_id === categoria.id)
        .reduce((acc, gasto) => acc + parseFloat(gasto.valor), 0);

      return {
        nome: categoria.nome,
        valor: valorTotalCategoria || 0,
        cor: categoria.cor || "#FFFFFF",
      };
    });

    const categoriesFilter = despesasPorCategoria.filter((cat) => cat.valor > 0);

    return {
      labels: categoriesFilter.map((cat) => cat.nome),
      datasets: [
        {
          data: categoriesFilter.map((cat) => cat.valor),
          backgroundColor: categoriesFilter.map((cat) => cat.cor),
          hoverOffset: 4,
        },
      ],
    };
  };

  // Montar o gráfico de despesas por nome (Nota: No modelo unificado usamos 'titulo')
  const expensesChart = () => {
    if (spends.length === 0 || dados.totalGastos === 0) return null;

    const gastosComCategoria = spends.map((gasto) => {
      const categoria = categories.find((cat) => cat.id === gasto.categoria_id);
      return {
        nome: gasto.titulo || "Sem nome",
        valor: parseFloat(gasto.valor),
        cor: categoria?.cor || "#FFFFFF",
      };
    });

    const gastosFiltrados = gastosComCategoria.filter((gasto) => gasto.valor > 0);

    return {
      labels: gastosFiltrados.map((gasto) => gasto.nome),
      datasets: [
        {
          data: gastosFiltrados.map((gasto) => gasto.valor),
          backgroundColor: gastosFiltrados.map((gasto) => gasto.cor),
          hoverOffset: 4,
        },
      ],
    };
  };

  // Montar o gráfico de receitas por categoria
  const incomesCategoryChart = () => {
    if (categories.length === 0 || dados.totalReceitas === 0) return null;

    const receitasPorCategoria = categories.map((categoria) => {
      const valorTotalCategoria = incomes
        .filter((receita) => receita.categoria_id === categoria.id)
        .reduce((acc, receita) => acc + parseFloat(receita.valor), 0);

      return {
        nome: categoria.nome,
        valor: valorTotalCategoria || 0,
        cor: categoria.cor || "#FFFFFF",
      };
    });

    const categoriesFilter = receitasPorCategoria.filter((cat) => cat.valor > 0);

    return {
      labels: categoriesFilter.map((cat) => cat.nome),
      datasets: [
        {
          data: categoriesFilter.map((cat) => cat.valor),
          backgroundColor: categoriesFilter.map((cat) => cat.cor),
          hoverOffset: 4,
        },
      ],
    };
  };

  // Montar o gráfico de receitas por nome (Usando 'titulo')
  const incomesChart = () => {
    if (incomes.length === 0 || dados.totalReceitas === 0) return null;

    const receitasComCategoria = incomes.map((receita) => {
      const categoria = categories.find((cat) => cat.id === receita.categoria_id);
      return {
        nome: receita.titulo || "Sem nome",
        valor: parseFloat(receita.valor),
        cor: categoria?.cor || "#FFFFFF",
      };
    });

    const receitasFiltradas = receitasComCategoria.filter((receita) => receita.valor > 0);

    return {
      labels: receitasFiltradas.map((receita) => receita.nome),
      datasets: [
        {
          data: receitasFiltradas.map((receita) => receita.valor),
          backgroundColor: receitasFiltradas.map((receita) => receita.cor),
          hoverOffset: 4,
        },
      ],
    };
  };

  // Gráfico de Linhas - 10 Maiores Transações
  const combinedLineChart = () => {
    if (spends.length === 0 && incomes.length === 0) return null;

    const combinedData = [
      ...spends.map((gasto) => ({
        nome: gasto.titulo || "Sem nome",
        valor: parseFloat(gasto.valor),
        tipo: "Gasto",
      })),
      ...incomes.map((receita) => ({
        nome: receita.titulo || "Sem nome",
        valor: parseFloat(receita.valor),
        tipo: "Receita",
      })),
    ];

    combinedData.sort((a, b) => b.valor - a.valor);
    const top10 = combinedData.slice(0, 10);
    const overflow = combinedData.slice(10);

    const overflowSum = overflow.reduce((acc, item) => acc + item.valor, 0);
    if (overflowSum > 0) {
      top10.push({ nome: "Outros", valor: overflowSum, tipo: "Outros" });
    }

    const data = {
      labels: top10.map((item) => item.nome),
      datasets: [
        {
          label: "Valores",
          data: top10.map((item) => item.valor),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        },
      ],
    };

    return <Line data={data} />;
  };

  return (
    <>
      <Navbar />
      <div className={styles.app_content}>
        {errorMessage && <p className={styles.error_message}>{errorMessage}</p>}
        <div className={styles.user_content}>
          <div className={styles.filter}></div>
          <div className={styles.user}>
            <h1>Olá! {nomeUsuario}</h1>
            <div className={styles.user_image}>
              <img src="/images/profile-icon.jpg" alt="Imagem Perfil" />
            </div>
          </div>
        </div>

        <div className={styles.status_content}>
          <div className={styles.metric}>
            <div className={styles.metric_img}>
              <img src="/images/saldo-img.png" alt="Imagem saldo atual" />
            </div>
            <div>
              <h3>Saldo atual</h3>
              <p>
                {dados.saldo !== 0
                  ? formatCurrency(dados.saldo)
                  : "Sem dados disponíveis"}
              </p>
            </div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metric_img}>
              <img src="/images/recipe-img.png" alt="Imagem total receitas" />
            </div>
            <div>
              <h3>Total em Receitas</h3>
              <p>
                {dados.totalReceitas !== 0
                  ? formatCurrency(dados.totalReceitas)
                  : "Sem dados disponíveis"}
              </p>
            </div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metric_img}>
              <img src="/images/drop-money.png" alt="Imagem total gastos" />
            </div>
            <div>
              <h3>Total em Gastos</h3>
              <p>
                {dados.totalGastos !== 0
                  ? formatCurrency(dados.totalGastos)
                  : "Sem dados disponíveis"}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.dashboards_content}>
          <div className={styles.dashboard_donut}>
            <h3>Total de Despesas por Categoria</h3>
            <div>
              {dados.totalGastos === 0 || categories.length === 0 ? (
                "Sem dados disponíveis"
              ) : (
                <Doughnut data={expensesCategoryChart()} />
              )}
            </div>
          </div>

          <div className={styles.dashboard_donut}>
            <h3>Total de Despesas por Nome</h3>
            <div>
              {dados.totalGastos === 0 || categories.length === 0 ? (
                "Sem dados disponíveis"
              ) : (
                <Doughnut data={expensesChart()} />
              )}
            </div>
          </div>
        </div>

        <div className={styles.dashboards_content}>
          <div className={styles.dashboard_donut}>
            <h3>Total de Receitas por Categoria</h3>
            <div>
              {dados.totalReceitas === 0 || categories.length === 0 ? (
                "Sem dados disponíveis"
              ) : (
                <Doughnut data={incomesCategoryChart()} />
              )}
            </div>
          </div>

          <div className={styles.dashboard_donut}>
            <h3>Total de Receitas por Fonte de Renda</h3>
            <div>
              {dados.totalReceitas === 0 || categories.length === 0 ? (
                "Sem dados disponíveis"
              ) : (
                <Doughnut data={incomesChart()} />
              )}
            </div>
          </div>
        </div>

        <div className={styles.dashboards_content}>
          <div className={styles.dashboard_lines}>
            <h3>Gráfico de Linhas - 10 Maiores Gastos e Receitas</h3>
            <div>
              {spends.length === 0 && incomes.length === 0
                ? "Sem dados disponíveis"
                : combinedLineChart()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(DashboardPage);

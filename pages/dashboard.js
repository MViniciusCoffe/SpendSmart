import { useState, useEffect } from "react";
import withAuth from "./components/utils/withAuth";
import styles from "./dashboard.module.css";
import Navbar from "../components/Navbar/navbarApp.js";
import axios from "axios";
import Cookies from "js-cookie";
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

function dashboard() {
  const [dados, setDados] = useState({
    saldo: 0,
    totalReceitas: 0,
    totalGastos: 0,
  });
  const [spends, setSpends] = useState([]);
  const [incomes, setIncomes] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const [nomeUsuario, setNomeUsuario] = useState("Sem dados");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const userCookie = Cookies.get("user");

    if (userCookie) {
      // Converter de string JSON para objeto
      const user = JSON.parse(userCookie);
      // Atualiza o estado com o nome do usuário
      setNomeUsuario(user.nome_completo || "Sem dados");
    }
  }, []);

  useEffect(() => {
    const authToken = Cookies.get("authToken");
    const userId = JSON.parse(Cookies.get("user")).id;

    const fetchData = async () => {
      try {
        const responseIncome = await axios.get("http://54.227.20.33:5000/income", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        });
        const incomesData = responseIncome.data;

        const incomes = incomesData.filter(
          (renda) => renda.usuario_id === userId
        );
        setIncomes(incomes);

        const responseSpend = await axios.get("http://54.227.20.33:5000/spend", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        });
        const spendsData = responseSpend.data;

        const spends = spendsData.filter(
          (gasto) => gasto.usuario_id === userId
        );
        setSpends(spends);

        // O código soma todos os valores de valor presentes no array incomes e retorna o total acumulado.
        const totalReceitas = incomes.reduce(
          (acc, item) => acc + parseFloat(item.valor),
          0
        );

        const totalGastos = spends.reduce(
          (acc, item) => acc + parseFloat(item.valor),
          0
        );
        const saldo = totalReceitas - totalGastos;

        const data = {
          saldo,
          totalReceitas,
          totalGastos,
        };

        setDados(data);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage("Houve um erro ao atualizar os dados");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const authToken = Cookies.get("authToken");
    const userId = JSON.parse(Cookies.get("user")).id;

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
          (categoria) => categoria.usuario_id === userId
        );

        setCategories(categoriasFiltradas);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage("Houve um erro ao recuperar as categorias");
      }
    };

    fetchCategorias();
  }, []);

  // Formatar valores para dinheiro em Real
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Montar o gráfico de despesas
  const expensesCategoryChart = () => {
    if (categories.length === 0 || dados.totalGastos === 0) {
      return null; // Sem dados disponíveis
    }

    // Mapear as categorias e somar os valores das despesas
    const despesasPorCategoria = categories.map((categoria) => {
      const valorTotalCategoria = spends
        ?.filter((gasto) => gasto.categoria_id === categoria.id)
        .reduce((acc, gasto) => acc + parseFloat(gasto.valor), 0);

      return {
        nome: categoria.nome,
        valor: valorTotalCategoria || 0,
        cor: categoria.cor || "#FFFFFF", // Cor padrão se não houver cor na categoria
      };
    });

    // Filtrar apenas categorias com valores > 0
    const categoriesFilter = despesasPorCategoria.filter(
      (cat) => cat.valor > 0
    );

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

  const expensesChart = () => {
    if (spends.length === 0 || dados.totalGastos === 0) {
      return null; // Sem dados disponíveis
    }

    // Mapear os gastos e associá-los às suas categorias
    const gastosComCategoria = spends.map((gasto) => {
      const categoria = categories.find((cat) => cat.id === gasto.categoria_id);
      return {
        nome: gasto.nome || "Sem nome", // Nome do gasto (ou padrão se não existir)
        valor: parseFloat(gasto.valor), // Valor do gasto
        cor: categoria?.cor || "#FFFFFF", // Cor da categoria correspondente (ou padrão)
      };
    });

    // Filtrar apenas os gastos com valores > 0
    const gastosFiltrados = gastosComCategoria.filter(
      (gasto) => gasto.valor > 0
    );

    return {
      labels: gastosFiltrados.map((gasto) => gasto.nome), // Nomes dos gastos
      datasets: [
        {
          data: gastosFiltrados.map((gasto) => gasto.valor), // Valores dos gastos
          backgroundColor: gastosFiltrados.map((gasto) => gasto.cor), // Cores associadas
          hoverOffset: 4,
        },
      ],
    };
  };

  const incomesCategoryChart = () => {
    if (categories.length === 0 || dados.totalReceitas === 0) {
      return null; // Sem dados disponíveis
    }

    // Mapear as categorias e somar os valores das despesas
    const despesasPorCategoria = categories.map((categoria) => {
      const valorTotalCategoria = incomes
        ?.filter((receita) => receita.categoria_id === categoria.id)
        .reduce((acc, receita) => acc + parseFloat(receita.valor), 0);

      return {
        nome: categoria.nome,
        valor: valorTotalCategoria || 0,
        cor: categoria.cor || "#FFFFFF", // Cor padrão se não houver cor na categoria
      };
    });

    // Filtrar apenas categorias com valores > 0
    const categoriesFilter = despesasPorCategoria.filter(
      (cat) => cat.valor > 0
    );

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

  const incomesChart = () => {
    if (incomes.length === 0 || dados.totalReceitas === 0) {
      return null; // Sem dados disponíveis
    }

    // Mapear as receitas e associá-los às suas categorias
    const receitasComCategoria = incomes.map((receita) => {
      const categoria = categories.find(
        (cat) => cat.id === receita.categoria_id
      );
      return {
        nome: receita.fonte_renda || "Sem nome", // Nome do receita (ou padrão se não existir)
        valor: parseFloat(receita.valor), // Valor do receita
        cor: categoria?.cor || "#FFFFFF", // Cor da categoria correspondente (ou padrão)
      };
    });

    // Filtrar apenas as receitas com valores > 0
    const receitasFiltradas = receitasComCategoria.filter(
      (receita) => receita.valor > 0
    );

    return {
      labels: receitasFiltradas.map((receita) => receita.nome), // Nomes das receitas
      datasets: [
        {
          data: receitasFiltradas.map((receita) => receita.valor), // Valores das receitas
          backgroundColor: receitasFiltradas.map((receita) => receita.cor), // Cores associadas
          hoverOffset: 4,
        },
      ],
    };
  };

  // Mostrar o gráfico de barras
  const combinedLineChart = () => {
    if (spends.length === 0 && incomes.length === 0) {
      return null; // Sem dados disponíveis
    }

    // Combinar receitas e despesas em um único array
    const combinedData = [
      ...spends.map((gasto) => ({
        nome: gasto.nome || "Sem nome",
        valor: parseFloat(gasto.valor),
        tipo: "Gasto",
      })),
      ...incomes.map((receita) => ({
        nome: receita.fonte_renda || "Sem nome",
        valor: parseFloat(receita.valor),
        tipo: "Receita",
      })),
    ];

    // Ordenar pelos valores e separar os 10 maiores
    combinedData.sort((a, b) => b.valor - a.valor);
    const top10 = combinedData.slice(0, 10);
    const overflow = combinedData.slice(10);

    // Somar o restante dos valores como "Outros"
    const overflowSum = overflow.reduce((acc, item) => acc + item.valor, 0);
    if (overflowSum > 0) {
      top10.push({ nome: "Outros", valor: overflowSum, tipo: "Outros" });
    }

    // Preparar os dados para o gráfico
    const data = {
      labels: top10.map((item) => item.nome), // Eixo X com nomes das categorias
      datasets: [
        {
          label: "Valores",
          data: top10.map((item) => item.valor), // Valores para o eixo Y
          borderColor: "rgba(75, 192, 192, 1)", // Cor da linha
          backgroundColor: "rgba(75, 192, 192, 0.2)", // Cor do fundo
          tension: 0.3, // Suavização da linha
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false, // Desativa a manutenção da proporção de aspecto
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
            {/* Ajeitar bug que o nome não atualiza no dashboard quando eu atualizo no banco de dados */}
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
              {/* Renderiza "Sem dados disponíveis" caso não tenha saldo */}
              <p>
                {dados.saldo !== 0
                  ? formatCurrency(dados.saldo)
                  : "Sem dados disponíveis"}
              </p>
            </div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metric_img}>
              <img src="/images/recipe-img.png" alt="Imagem saldo atual" />
            </div>
            <div>
              <h3>Total em Receitas</h3>
              {/* Renderiza "Sem dados disponíveis" caso não tenha receitas */}
              <p>
                {dados.totalReceitas !== 0
                  ? formatCurrency(dados.totalReceitas)
                  : "Sem dados disponíveis"}
              </p>
            </div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metric_img}>
              <img src="/images/drop-money.png" alt="Imagem saldo atual" />
            </div>
            <div>
              <h3>Total em Gastos</h3>
              {/* Renderiza "Sem dados disponíveis" caso não tenha gastos */}
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

// Redireciona o usuário para "login" caso ele não esteja logado
export default withAuth(dashboard);

import withAuth from "./components/utils/withAuth";
import Navbar from "../components/Navbar/navbarApp";
import styles from "./categoriaPage.module.css";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import axios from "axios";

// aqui vou poder cadastrar tanto os gastos como as suas respectivas categorias, mesma coisa com rendaPage
function categoriaPage() {
  // Variáveis para salvar as categorias
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("receita");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#FFFFFF");

  // Variáveis para editar as categorias
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState("receita");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCor, setEditCor] = useState("#FFFFFF");

  // Tipos de erros usados em cada "aba"
  const [addingErrorMessage, setAddingErrorMessage] = useState("");
  const [updatingErrorMessage, setUpdatingErrorMessage] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState("add");

  // Variáveis para categorias
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [categoryUpdateSelected, setCategoryUpdateSelected] = useState("");
  const [categoryDetails, setCategoryDetails] = useState(null);

  // Recuperar informações do usuário
  const [userId, setUserId] = useState(null);
  const authToken = Cookies.get("authToken");

  // Ativa um gatilho
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const userId = JSON.parse(Cookies.get("user")).id;
    setUserId(userId);

    if (activeTab === "delete") {
      const fetchCategorias = async () => {
        try {
          const response = await axios.get("http://54.227.20.33:5000/category", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer: ${authToken}`,
            },
          });

          const categoriasFiltradas = response.data.filter(
            (categoria) => categoria.usuario_id === userId
          );

          setCategories(categoriasFiltradas);
          setDeleteErrorMessage("");
        } catch (error) {
          setDeleteErrorMessage("Houve um erro ao atualizar os dados");
        }
      };

      fetchCategorias();
    }

    if (activeTab === "edit") {
      const fetchCategorias = async () => {
        try {
          const response = await axios.get("http://54.227.20.33:5000/category", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer: ${authToken}`,
            },
          });

          const categoriasFiltradas = response.data.filter(
            (categoria) => categoria.usuario_id === userId
          );

          setCategories(categoriasFiltradas);
          setUpdatingErrorMessage("");
        } catch (error) {
          setUpdatingErrorMessage("Houve um erro ao atualizar os dados");
        }
      };

      fetchCategorias();
    }
    // toda as vezes que esses valores mudarem, o useEffect roda de novo
  }, [activeTab, authToken, updateTrigger]);

  // Função para salvar categoria
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://54.227.20.33:5000/category",
        JSON.stringify({
          nome,
          tipo,
          descricao,
          cor,
          userId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        }
      );

      setAddingErrorMessage("");
      alert("Categoria adicionada com Sucesso");
    } catch (error) {
      if (!error?.response) {
        setAddingErrorMessage("Erro ao acessar o servidor.");
      } else if (error.response.status == 400) {
        setAddingErrorMessage("Categoria já existe no banco de dados.");
      } else {
        setAddingErrorMessage("Erro desconhecido ao atualizar os dados.");
      }
    }
  };

  // Função para deletar categoria
  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.delete(
        `http://54.227.20.33:5000/category/${categorySelected}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        }
      );

      alert("Categoria Removida com sucesso!");
      setDeleteErrorMessage("");

      // Roda o useEffect novamente, já que o valor de updateTrigger mudou
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      // Definir erro caso tente remover uma categoria que esteja sendo usada
      if (!error?.response) {
        setDeleteErrorMessage("Erro ao acessar o servidor");
      } else if (error.response.status == 404) {
        setDeleteErrorMessage("Categoria não encontrada");
      } else {
        setDeleteErrorMessage("Houve um erro desconhecido");
      }
    }
  };

  // Função para editar categoria
  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `http://54.227.20.33:5000/category/${categoryUpdateSelected}`,
        JSON.stringify({
          editNome,
          editTipo,
          editDescricao,
          editCor,
          userId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer: ${authToken}`,
          },
        }
      );

      setUpdatingErrorMessage("");
      alert("Categoria atualizada com sucesso");

      // Roda o useEffect novamente
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      if (!error?.response) {
        setUpdatingErrorMessage("Erro ao acessar o servidor.");
      } else if (error.response.status == 400) {
        setUpdatingErrorMessage("Categoria já existe no banco de dados.");
      } else {
        setUpdatingErrorMessage("Erro desconhecido ao atualizar os dados.");
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

          {/* Botão de Editar */}
          <button
            className={`${styles.tab_button} ${
              activeTab === "edit" ? styles.active_tab : ""
            }`}
            onClick={() => setActiveTab("edit")}
          >
            Editar
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
            <h1 className={styles.content_h1}>Adicionar Categorias</h1>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="nome">
                Nome da Categoria
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="nome"
                value={nome}
                placeholder="Nome da Categoria"
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="tipo">
                Tipo
              </label>
              <select
                className={styles.input_data}
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
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
              <label className={styles.input_title} htmlFor="cor">
                Cor
              </label>
              <div className={styles.color_picker_container}>
                <input
                  className={styles.input_data}
                  type="color"
                  id="cor"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                />
                <div
                  className={styles.color_display}
                  style={{ backgroundColor: cor }}
                ></div>
                <span className={styles.hex_value}>{cor}</span>
              </div>
            </div>

            {addingErrorMessage && (
              <p className={styles.error_message}>{addingErrorMessage}</p>
            )}

            <div className={styles.button_group}>
              <button
                type="submit"
                className={styles.save_button}
                disabled={!nome}
              >
                Salvar Categoria
              </button>
            </div>
          </form>
        )}

        {/* Se o botão for "Editar" */}
        {activeTab === "edit" && (
          <form className={styles.form_content} onSubmit={handleEdit}>
            <h1 className={styles.content_h1}>Editar Categoria</h1>
            {/* Lógica para editar categorias */}

            <label className={styles.input_title} htmlFor="categoria">
              Selecionar Categoria
            </label>
            <select
              className={styles.input_data}
              id="categoria"
              value={categoryUpdateSelected}
              onChange={(e) => {
                setCategoryUpdateSelected(Number(e.target.value));

                // procura em (categoria) a que possui o mesmo id de (e.target.value)
                const category = categories.find(
                  (cat) => cat.id === Number(e.target.value)
                );

                setCategoryDetails(category || null);

                if (category) {
                  setEditNome(category.nome);
                  setEditTipo(category.tipo);
                  setEditDescricao(category.descricao || "");
                  setEditCor(category.cor || "FFFFFF");
                }
              }}
            >
              <option value="" disabled>
                Selecionar uma categoria
              </option>

              {/* Exibir as categorias dentro da tag <options> */}
              {categories.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="nome">
                Nome da Categoria
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="nome"
                value={editNome}
                placeholder="Nome da Categoria"
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="tipo">
                Tipo
              </label>
              <select
                className={styles.input_data}
                id="tipo"
                value={editTipo}
                onChange={(e) => setEditTipo(e.target.value)}
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="descricao">
                Descrição
              </label>
              <input
                className={styles.input_data}
                type="text"
                id="descricao"
                value={editDescricao}
                placeholder="Descrição (Opcional)"
                onChange={(e) => setEditDescricao(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="cor">
                Cor
              </label>
              <input
                className={styles.input_data}
                type="color"
                id="cor"
                value={editCor}
                onChange={(e) => setEditCor(e.target.value)}
              />
            </div>

            {updatingErrorMessage && (
              <p className={styles.error_message}>{updatingErrorMessage}</p>
            )}

            <div className={styles.button_group}>
              <button
                type="submit"
                className={styles.edit_button}
                disabled={!categoryUpdateSelected || !editNome}
              >
                Editar Categoria
              </button>
            </div>
          </form>
        )}

        {/* Fazer esses dois depois de fazer renda e gastos, para evitar erro de banco, por exemplo: Se tal categoria usada em tal gasto e se ela for deletada ou editar, não ter problema */}
        {/* Se o botão for "Deletar" */}
        {activeTab === "delete" && (
          <form className={styles.form_content} onSubmit={handleDelete}>
            <h1 className={styles.content_h1}>Excluir Categoria</h1>
            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="categoria">
                Selecionar Categoria
              </label>
              <select
                className={styles.input_data}
                id="categoria"
                value={categorySelected}
                onChange={(e) => {
                  setCategorySelected(Number(e.target.value));

                  // procura em (categoria) a que possui o mesmo id de (e.target.value)
                  const category = categories.find(
                    (cat) => cat.id === Number(e.target.value)
                  );

                  setCategoryDetails(category || null);
                }}
              >
                <option value="" disabled>
                  Selecionar uma categoria
                </option>

                {/* Exibir as categorias dentro da tag <options> */}
                {categories.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              {/* Exibir detalhes da categoria */}
              <div className={styles.category_details}>
                <h2>Detalhes da Categoria</h2>
                <p>
                  <strong>Nome:</strong> {categoryDetails?.nome || "Sem dados"}
                </p>
                <p>
                  <strong>Tipo:</strong> {categoryDetails?.tipo || "Sem dados"}
                </p>
                <p>
                  <strong>Descrição:</strong>{" "}
                  {categoryDetails?.descricao || "Nenhuma descrição fornecida."}
                </p>
                <p>
                  <strong>Cor:</strong>{" "}
                  <span
                    style={{
                      display: "inline-block",
                      width: "20px",
                      height: "20px",
                      backgroundColor: categoryDetails?.cor,
                      border: "1px solid #000",
                    }}
                  ></span>{" "}
                  {categoryDetails?.cor || "Sem dados"}
                </p>
                <p>
                  <strong>Quantidade de usos: 0</strong>
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
                disabled={!categorySelected}
              >
                Excluir Categoria
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

export default withAuth(categoriaPage);

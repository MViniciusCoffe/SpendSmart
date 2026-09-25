import { useEffect, useState } from "react";
import withAuth from "./components/utils/withAuth";
import Navbar from "../components/Navbar/navbarApp";
import styles from "./categoriaPage.module.css";
import { categoryService } from "../services/categoryService";

function CategoriaPage() {
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

  // Aba ativa, por padrão é a de adicionar
  const [activeTab, setActiveTab] = useState("add");

  // Variáveis para categorias
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [categoryUpdateSelected, setCategoryUpdateSelected] = useState("");
  const [categoryDetails, setCategoryDetails] = useState(null);

  // Recuperar informações do usuário
  const [userId, setUserId] = useState(null);
  const authToken = Cookies.get("authToken");

  // Ativa um gatilho para atualizar as categorias quando uma ação é realizada (adicionar, editar ou deletar)
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);

        setAddingErrorMessage("");
        setUpdatingErrorMessage("");
        setDeleteErrorMessage("");
      } catch (error) {
        console.error("[Fetch Categories Error]", error);
      }
    };

    fetchCategorias();
  }, [updateTrigger]);

  // Função para salvar categoria
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await categoryService.createCategory({ nome, tipo, descricao, cor });
      setAddingErrorMessage("");
      alert("Categoria adicionada com sucesso!");

      // Limpar campos após salvar
      setNome("");
      setTipo("receita");
      setDescricao("");
      setCor("#FFFFFF");

      // Roda o useEffect novamente, já que o valor de updateTrigger mudou
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      setAddingErrorMessage(error.message);
    }
  };

  // Função para deletar categoria
  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      await categoryService.deleteCategory(categorySelected);
      setDeleteErrorMessage("");
      alert("Categoria deletada com sucesso!");

      // Limpar campos após deletar
      setCategorySelected("");
      setCategoryDetails(null);

      // Roda o useEffect novamente
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      setDeleteErrorMessage(error.message);
    }
  };

  // Função para editar categoria
  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      await categoryService.updateCategory({
        id: categoryUpdateSelected,
        nome: editNome,
        tipo: editTipo,
        descricao: editDescricao,
        cor: editCor,
      });

      setUpdatingErrorMessage("");
      alert("Categoria atualizada com sucesso!");
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      setUpdatingErrorMessage(error.message);
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
            className={`${styles.tab_button} ${activeTab === "edit" ? styles.active_tab : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            Editar
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
            <h1 className={styles.content_h1}>Adicionar Categorias</h1>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="nome">Nome da Categoria</label>
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
              <label className={styles.input_title} htmlFor="tipo">Tipo</label>
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
              <label className={styles.input_title} htmlFor="descricao">Descrição</label>
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
              <label className={styles.input_title} htmlFor="cor">Cor</label>
              <div className={styles.color_picker_container}>
                <input
                  className={styles.input_data}
                  type="color"
                  id="cor"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                />
                <div className={styles.color_display} style={{ backgroundColor: cor }}></div>
                <span className={styles.hex_value}>{cor}</span>
              </div>
            </div>

            {addingErrorMessage && <p className={styles.error_message}>{addingErrorMessage}</p>}

            <div className={styles.button_group}>
              <button type="submit" className={styles.save_button} disabled={!nome}>
                Salvar Categoria
              </button>
            </div>
          </form>
        )}

        {/* --- ABA EDITAR --- */}
        {activeTab === "edit" && (
          <form className={styles.form_content} onSubmit={handleEdit}>
            <h1 className={styles.content_h1}>Editar Categoria</h1>

            <label className={styles.input_title} htmlFor="categoria">Selecionar Categoria</label>
            <select
              className={styles.input_data}
              id="categoria"
              value={categoryUpdateSelected}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                setCategoryUpdateSelected(selectedId);
                const category = categories.find((cat) => cat.id === selectedId);
                setCategoryDetails(category || null);

                if (category) {
                  setEditNome(category.nome);
                  setEditTipo(category.tipo);
                  setEditDescricao(category.descricao || "");
                  setEditCor(category.cor || "#FFFFFF");
                }
              }}
            >
              <option value="" disabled>Selecionar uma categoria</option>
              {categories.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="edit_nome">Nome da Categoria</label>
              <input
                className={styles.input_data}
                type="text"
                id="edit_nome"
                value={editNome}
                placeholder="Nome da Categoria"
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="edit_tipo">Tipo</label>
              <select
                className={styles.input_data}
                id="edit_tipo"
                value={editTipo}
                onChange={(e) => setEditTipo(e.target.value)}
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="edit_descricao">Descrição</label>
              <input
                className={styles.input_data}
                type="text"
                id="edit_descricao"
                value={editDescricao}
                placeholder="Descrição (Opcional)"
                onChange={(e) => setEditDescricao(e.target.value)}
              />
            </div>

            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="edit_cor">Cor</label>
              <input
                className={styles.input_data}
                type="color"
                id="edit_cor"
                value={editCor}
                onChange={(e) => setEditCor(e.target.value)}
              />
            </div>

            {updatingErrorMessage && <p className={styles.error_message}>{updatingErrorMessage}</p>}

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

        {/* --- ABA EXCLUIR --- */}
        {activeTab === "delete" && (
          <form className={styles.form_content} onSubmit={handleDelete}>
            <h1 className={styles.content_h1}>Excluir Categoria</h1>
            <div className={styles.form_group}>
              <label className={styles.input_title} htmlFor="delete_categoria">Selecionar Categoria</label>
              <select
                className={styles.input_data}
                id="delete_categoria"
                value={categorySelected}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  setCategorySelected(selectedId);
                  const category = categories.find((cat) => cat.id === selectedId);
                  setCategoryDetails(category || null);
                }}
              >
                <option value="" disabled>Selecionar uma categoria</option>
                {categories.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <div className={styles.category_details}>
                <h2>Detalhes da Categoria</h2>
                <p><strong>Nome:</strong> {categoryDetails?.nome || "Sem dados"}</p>
                <p><strong>Tipo:</strong> {categoryDetails?.tipo || "Sem dados"}</p>
                <p><strong>Descrição:</strong> {categoryDetails?.descricao || "Nenhuma descrição fornecida."}</p>
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
                <p><strong>Quantidade de usos: 0</strong></p>
              </div>
            </div>

            {deleteErrorMessage && <p className={styles.error_message}>{deleteErrorMessage}</p>}

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

export default withAuth(CategoriaPage);

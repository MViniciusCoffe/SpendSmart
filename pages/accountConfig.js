import { useState } from "react";
import styles from "./accountConfig.module.css";
import Navbar from "../components/Navbar/navbarApp";
import withAuth from "./components/utils/withAuth";
import Cookies from "js-cookie";
import axios from "axios";
import { useRouter } from "next/router";

function accountConfig() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const isSaveDisabled = !nome && !senha && !dataNascimento && !telefone;

  // Função para editar o usuário
  const handleEdit = async (e) => {
    e.preventDefault();

    const userEmail = JSON.parse(Cookies.get("user")).email;
    const authToken = Cookies.get("authToken");

    try {
      const updatedData = {
        nome_completo: nome || null,
        senha: senha || null,
        data_nascimento: dataNascimento || null,
        telefone: telefone || null,
      };

      // Filtrar dados não preenchidos, removendo campos não preenchidos
      const filteredData = Object.fromEntries(
        Object.entries(updatedData).filter(([_, v]) => v !== null)
      );

      const response = await axios.put(
        `http://54.227.20.33:5000/user/${userEmail}`,
        filteredData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Substitui o cookie antigo pelo novo com o usuário atualizado
      const updatedUser = JSON.stringify(response.data.updatedUser);
      Cookies.set("user", updatedUser, { expires: 7 });

      setErrorMessage("");
      alert("Alterações salvas com sucesso!");
    } catch (error) {
      if (!error?.response) {
        setErrorMessage("Erro ao acessar o servidor");
      } else if (error.response.status === 400) {
        setErrorMessage("Erro ao atualizar os dados. Verifique os campos.");
      } else {
        setErrorMessage("Erro desconhecido ao atualizar os dados.");
      }
    }
  };

  // Função para deletar o usuário
  const handleDelete = async (e) => {
    e.preventDefault();

    const authToken = Cookies.get("authToken");
    const userEmail = JSON.parse(Cookies.get("user")).email;

    try {
      const response = await axios.delete(
        `http://54.227.20.33:5000/user/${userEmail}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      alert("Conta deletada com sucesso");

      Cookies.remove("authToken");
      Cookies.remove("user");
      router.push("/login");
    } catch (error) {
      if (!error?.response) {
        setErrorMessage("Erro ao acessar o servidor");
      } else {
        setErrorMessage("Operação não autorizada");
      }
    }
  };

  return (
    <>
      <Navbar></Navbar>
      <div className={styles.app_content}>
        <form className={styles.form_content}>
          <h1 className={styles.content_h1}>Configurações da Conta</h1>
          <div className={styles.form_group}>
            <label className={styles.input_title} htmlFor="nome_completo">
              Nome Completo
            </label>
            <input
              className={styles.input_data}
              type="text"
              id="nome_completo"
              placeholder="Seu nome completo"
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label className={styles.input_title} htmlFor="senha">
              Senha
            </label>
            <input
              className={styles.input_data}
              type="password"
              id="senha"
              placeholder="Sua senha"
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label className={styles.input_title} htmlFor="data_nascimento">
              Data de Nascimento
            </label>
            <input
              className={styles.input_data}
              type="date"
              id="data_nascimento"
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label className={styles.input_title} htmlFor="telefone">
              Telefone
            </label>
            <input
              className={styles.input_data}
              type="text"
              id="telefone"
              placeholder="Seu telefone"
              maxLength={20}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p className={styles.error_message}>{errorMessage}</p>
          )}

          <div className={styles.button_group}>
            <button
              type="submit"
              className={styles.save_button}
              onClick={(e) => handleEdit(e)}
              disabled={isSaveDisabled}
            >
              Salvar Alterações
            </button>
            <button
              type="button"
              className={styles.delete_button}
              onClick={(e) => handleDelete(e)}
            >
              Excluir Conta
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default withAuth(accountConfig);

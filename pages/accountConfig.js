import { useState } from "react";
import { useRouter } from "next/router";
import styles from "./accountConfig.module.css";
import Navbar from "../components/Navbar/navbarApp";
import withAuth from "../components/utils/withAuth";
import { profileService } from "../services/profileService";
import { supabase } from "../infra/supabase"; // Apenas para o logout

function AccountConfig() {
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

    try {
      await profileService.updateProfile({
        nome: nome,
        senha: senha,
        dataNascimento: dataNascimento,
        telefone: telefone
      });

      setErrorMessage("");
      alert("Alterações salvas com sucesso!");

      // Limpar os campos para o usuário saber que foi salvo
      setNome("");
      setSenha("");
      setDataNascimento("");
      setTelefone("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Função para deletar o usuário
  const handleDelete = async (e) => {
    e.preventDefault();

    const confirmacao = window.confirm("Tem certeza que deseja excluir sua conta? Todos os seus dados serão apagados para sempre.");
    if (!confirmacao) return;

    try {
      // A tela só dá a ordem para o serviço. Zero HTTP aqui!
      await profileService.deleteAccount();

      alert("Conta excluída com sucesso.");

      // Limpa a sessão local e manda pro login
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <>
      {/* Mantive a Navbar aqui conforme você pediu para mexermos no _app.js depois */}
      <Navbar />

      <div className={styles.app_content}>
        <form className={styles.form_content} onSubmit={handleEdit}>
          <h1 className={styles.content_h1}>Configurações da Conta</h1>

          <div className={styles.form_group}>
            <label className={styles.input_title} htmlFor="nome_completo">
              Nome Completo
            </label>
            <input
              className={styles.input_data}
              type="text"
              id="nome_completo"
              value={nome}
              placeholder="Seu nome completo"
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label className={styles.input_title} htmlFor="senha">
              Nova Senha
            </label>
            <input
              className={styles.input_data}
              type="password"
              id="senha"
              value={senha}
              placeholder="Sua nova senha"
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
              value={dataNascimento}
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
              value={telefone}
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
              disabled={isSaveDisabled}
            >
              Salvar Alterações
            </button>
            <button
              type="button"
              className={styles.delete_button}
              onClick={handleDelete}
            >
              Excluir Conta
            </button>
          </div>

          {/* Um botão de logout amigável é sempre bom nas configurações */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}>
              Sair da minha conta
            </button>
          </div>

        </form>
      </div>
    </>
  );
}

export default withAuth(AccountConfig);

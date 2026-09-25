import Link from "next/link";
import styles from "./navbarApp.module.css";
import { useRouter } from "next/router";
import { supabase } from "../../infra/supabase";

function NavbarApp() {
  const router = useRouter();

  const handleLogout = async (e) => {
    e.preventDefault();

    // Desloga do Supabase
    await supabase.auth.signOut(); 
    router.replace("/login"); 
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <img src="/images/logo.svg" alt="Logo do Spend Smart"></img>
      </div>
      <div className={styles.navigation}>
        <ul className={styles.links}>
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/rendaPage">Configurar Receitas</Link></li>
          <li><Link href="/gastosPage">Configurar Despesas</Link></li>
          <li><Link href="/categoriaPage">Configurar Categorias</Link></li>
          <li><Link href="/accountConfig">Configurações da conta</Link></li>
          <li>
            <button
              className={styles.exit_button}
              onClick={(e) => handleLogout(e)}
            >
              Sair
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default NavbarApp;
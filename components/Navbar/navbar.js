import Link from "next/link";
import styles from "./navbar.module.css";

function navbar() {
  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <img src="/images/logo.svg" alt="Logo do Spend Smart"></img>
      </div>
      <div className={styles.navigation}>
        <ul className={styles.links}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/about">Sobre</Link>
          </li>
          <li>
            <Link href="/contact">Contatos</Link>
          </li>
          <li>
            <Link href="/login">Login</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default navbar;

import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import NavbarApp from "../components/Navbar/navbarApp"; 
// Navbar Privada
import NavbarPublic from "../components/Navbar/navbar"; 
// Navbar Pública
import "../components/style/global.css";

function App({ Component, pageProps }) {
  const router = useRouter();

  // 1. Definimos quais rotas usam a Navbar Pública (A Vitrine)
  const publicRoutes = ["/", "/about", "/contact", "/login", "/cadastro"]; 
  
  // 2. Checamos se a página atual é pública
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <>
      <Head>
        <title>Spend Smart</title>
        <meta
          name="description"
          content="Spend Smart - Gerencie seus gastos com inteligência."
        />
        <link rel="icon" href="/images/favicon.ico" />
      </Head>

      {/* Renderização Condicional: É pública? Mostra NavbarPublic. Senão, mostra NavbarApp */}
      {isPublicRoute ? <NavbarPublic /> : <NavbarApp />}

      <Component {...pageProps} />
    </>
  );
}

export default App;
import React from "react";
import Head from "next/head";
import "../components/style/global.css";

function App({ Component, pageProps }) {
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
      <Component {...pageProps} />
    </>
  );
}

export default App;

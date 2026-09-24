import React from "react";
import Navbar from "../components/Navbar/navbar";
import styles from "./index.module.css";
import Link from "next/link";

function Home() {
  return (
    <>
      <Navbar></Navbar>
      <div className={styles.carousel}>
        <svg
          className={`${styles.carousel_arrow} ${styles.prev}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="5 12 12 5 19 12" />
        </svg>
        <svg
          className={`${styles.carousel_arrow} ${styles.next}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="5 12 12 5 19 12" />
        </svg>
        <div className={`${styles.carousel_slide} ${styles.visible}`}>
          <div className={styles.slide_text}>
            <span>Bem vindo a SpendSmart</span>
            <h1>
            Organize seus gastos,<br /> realize seus sonhos.
            </h1>
            <div className={styles.slide_buttons}>
              <Link href="/about">Saiba Mais!</Link>
              <Link href="/login">Fazer Login</Link>
            </div>
          </div>
          <img
            src="/images/carousel1.jpg"
            alt="Carousel image 1"
            className={styles.slide_img}
          ></img>
        </div>
        <div className={styles.carousel_slide}>
          <img
            src="/images/carousel2.png"
            alt="Carousel image 2"
            className={styles.slide_img}
          ></img>
        </div>
      </div>
    </>
  );
}

export default Home;

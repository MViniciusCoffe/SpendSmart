import { useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();

    useEffect(() => {
      try {
        const token = Cookies.get("authToken");
        const user = JSON.parse(Cookies.get("user"));

        // Verifica se o token de autenticação e o usuário estão presentes, se não, redireciona para Login
        if (!token || !user) {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }
    }, []);

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;

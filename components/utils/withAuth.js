import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authService } from "../services/authServices";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const session = await authService.getSession();

          if (!session) {
            // Troca o topo da pilha router para não sujar histórico de navegação com páginas protegidas
            router.replace("/login");
          } else {
            setIsAuthorized(true);
          }
        } catch (error) {
          router.replace("/login");
        }
      };

      checkAuth();
    }, [router]);

    if (!isAuthorized) {
      return null; // Futuro componente de carregamento
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { authService } from "../../services/authServices"

const withAuth = WrappedComponent => {
  const AuthenticatedPage = props => {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const session = await authService.getSession()

          if (!session) {
            // Troca o topo da pilha router para não sujar histórico de navegação com páginas protegidas
            router.replace("/login")
          } else {
            setIsAuthorized(true)
          }
        } catch (error) {
          router.replace("/login")
        }
      }

      checkAuth()
    }, [router])

    if (!isAuthorized) {
      return null // Futuro componente de carregamento
    }

    return <WrappedComponent {...props} />
  }

  // Define um nome de exibição para facilitar a depuração
  const componentName = WrappedComponent.displayName || WrappedComponent.name || "Component"
  AuthenticatedPage.displayName = `withAuth(${componentName})`

  return AuthenticatedPage
}

export default withAuth

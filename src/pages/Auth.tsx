import { CorbadoAuth, useCorbado } from "@corbado/react"
import { useNavigate } from "react-router-dom"

export default function Auth() {

    const { isAuthenticated, loading } = useCorbado()
    const navigate = useNavigate()

    if (isAuthenticated && !loading) {
        navigate('/')
    }

    function onLogin() {
        navigate('/')
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <CorbadoAuth    onLoggedIn={onLogin} />
        </div>
    )
}

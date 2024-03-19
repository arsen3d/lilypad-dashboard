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
        <div className="mx-auto mt-5">
            <CorbadoAuth onLoggedIn={onLogin} />
        </div>
    )
}

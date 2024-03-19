import { useCorbado, useCorbadoSession, PasskeyList } from "@corbado/react"
import { useNavigate } from "react-router-dom"

export default function ProfilePage() {
    const { isAuthenticated, loading, logout } = useCorbado()
    const { user } = useCorbadoSession()
    const navigate = useNavigate()

    if (!isAuthenticated && !loading) {
        navigate("/auth")
    }

    return (
        <div className='text-center max-w-md mx-auto my-5 break-words border rounded-xl p-3'>
            <h1 className='text-2xl'>Profile</h1>
            {user && (
                <>
                    <p>Email: {user.email}</p>
                    <p>Name: {user.name}</p>
                    <div className="text-left">
                        <PasskeyList />
                    </div>
                    <button
                        onClick={logout}
                        className='bg-blue-300 px-3 py-2 rounded-full'>
                        Logout
                    </button>
                </>
            )}
        </div>
    )
}

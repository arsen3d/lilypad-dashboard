import { CorbadoProvider } from "@corbado/react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Auth from "./pages/Auth"
import Profile from "./pages/Profile"

const PROJECT_ID = import.meta.env.VITE_PUBLIC_CORBADO_PROJECT_ID

const RouteProvider = () => {
    const routes = [
        {
            path: "/",
            element: <Profile />,
        },
        {
            path: "/auth",
            element: <Auth />,
        },
    ]

    return <RouterProvider router={createBrowserRouter(routes)} />
}

function App() {
    return (
        <main>
            <CorbadoProvider projectId={PROJECT_ID} darkMode="off">
                <RouteProvider />
            </CorbadoProvider>
        </main>
    )
}

export default App

import Home from "@/app/home"
import "./globals.css"
import { Provider } from "@/app/provider"

export default function Page() {
    return (
        <Provider>
            <Home />
        </Provider>
    )
}

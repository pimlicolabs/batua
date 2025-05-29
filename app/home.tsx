import * as React from "react"
import Intro from "@/components/intro"
import Installation from "@/components/installation"
import Footer from "@/components/footer"
import Try from "@/components/try"

export default function Home() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <Intro />

            <Try />

            <Installation />

            <Footer />
        </div>
    )
}

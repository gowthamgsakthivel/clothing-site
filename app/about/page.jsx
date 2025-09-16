
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


export default function AboutPage() {
    return (
        <>
            <Navbar />
            <div className="relative overflow-hidden min-h-screen w-full flex items-center justify-center bg-white pt-3">
                {/* Animated gradient background */}
                <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-br from-blue-200 via-pink-100 to-yellow-100 opacity-90"></div>
                {/* Animated sparkles */}
                <div className="absolute left-0 top-0 w-full h-full pointer-events-none z-0">
                    {[...Array(18)].map((_, i) => (
                        <span
                            key={i}
                            className={`absolute sparkle animate-sparkle sparkle-${i}`}
                        />
                    ))}
                </div>
                <div className="relative z-10 w-full max-w-4xl mx-auto py-32 px-8 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-2xl border border-white/40">
                    <h1 className="text-5xl font-extrabold mb-8 text-gray-900 text-center drop-shadow-lg tracking-tight">About Sparrow Sports</h1>
                    <p className="text-2xl text-gray-700 mb-8 text-center font-medium">
                        Sparrow Sports is your one-stop destination for the latest and greatest in sportswear and lifestyle products. We are passionate about delivering quality, variety, and a seamless shopping experience to our customers.
                    </p>
                    <p className="text-lg text-gray-600 mb-4 text-center">
                        Our mission is to empower you to live your best life—whether you’re hitting the gym, exploring the outdoors, or upgrading your tech. We carefully curate our collection to bring you top brands, trending styles, and innovative gadgets.
                    </p>
                    <p className="text-lg text-gray-600 text-center">
                        Thank you for choosing Sparrow Sports. We’re here to help you look good, feel great, and stay ahead of the game!
                    </p>
                </div>
            </div>
            <Footer />
        </>
    )
}

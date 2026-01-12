
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
    title: 'About Us | Sparrow Sports',
    description: 'Learn about Sparrow Sports, your one-stop destination for the latest and greatest in sportswear and lifestyle products.',
    keywords: 'about us, sparrow sports, sports equipment, sports retailer, company mission, sports store',
    openGraph: {
        title: 'About Us | Sparrow Sports',
        description: 'Learn about Sparrow Sports, your one-stop destination for the latest and greatest in sportswear and lifestyle products.',
        url: '/about',
        images: [
            {
                url: '/logo.svg',
                width: 1200,
                height: 630,
                alt: 'Sparrow Sports Logo',
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About Us | Sparrow Sports',
        description: 'Learn about Sparrow Sports, your one-stop destination for the latest and greatest in sportswear and lifestyle products.',
        images: ['/logo.svg'],
        creator: '@sparrowsports',
        site: '@sparrowsports',
    }
};

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <div className="relative overflow-hidden min-h-screen w-full flex items-center justify-center bg-white pt-20 md:pt-24">
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
                <div className="relative z-10 w-full max-w-5xl mx-auto py-12 sm:py-20 md:py-32 px-4 sm:px-6 md:px-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white/80 backdrop-blur-2xl border border-white/40">
                    <h1 className="text-5xl font-extrabold mb-8 text-gray-900 text-center drop-shadow-lg tracking-tight">About Sparrow Sports</h1>
                    <p className="text-xl text-gray-700 mb-8 text-center font-medium leading-relaxed">
                        Sparrow Sports is your trusted destination for premium sportswear, activewear, lifestyle products, and innovative gadgets. We are committed to delivering top-quality gear, trending styles, and a smooth shopping experience—whether you're hitting the gym, exploring the outdoors, or upgrading your everyday essentials.
                    </p>
                    <p className="text-lg text-gray-600 mb-8 text-center leading-relaxed">
                        Along with our curated collection of leading brands, we also specialize in custom T-shirt printing, team jerseys, and bulk apparel orders for colleges, events, startups, and sports teams. Our custom solutions offer high-quality fabrics, sharp printing, and reliable delivery—perfect for anyone looking to create personalized or branded merchandise.
                    </p>
                    <p className="text-lg text-gray-600 text-center leading-relaxed">
                        At Sparrow Sports, our mission is simple: to help you look good, feel confident, and stay ahead of the game. Thank you for choosing us as your partner in performance, style, and creativity.
                    </p>
                </div>
            </div>
            <Footer />
        </>
    )
}

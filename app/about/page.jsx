import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
    title: 'About Us | Sparrow Sports',
    description: 'Learn about Sparrow Sports, your one-stop destination for premium athletic wear, custom design services, and innovative sports technology.',
    keywords: 'about us, sparrow sports, sports equipment, custom design, athletic wear, sports technology, premium sportswear',
    openGraph: {
        title: 'About Us | Sparrow Sports',
        description: 'Learn about Sparrow Sports, your one-stop destination for premium athletic wear, custom design services, and innovative sports technology.',
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
        description: 'Learn about Sparrow Sports, your one-stop destination for premium athletic wear, custom design services, and innovative sports technology.',
        images: ['/logo.svg'],
        creator: '@sparrowsports',
        site: '@sparrowsports',
    }
};

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="relative max-w-6xl mx-auto px-6 md:px-16 lg:px-32 text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            About <span className="text-yellow-300">Sparrow Sports</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
                            Revolutionizing the way you shop for premium athletic wear and custom sports equipment
                        </p>
                    </div>
                </div>

                {/* Story Section */}
                <div className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                                <p className="text-lg text-gray-600 mb-6">
                                    Founded with a vision to bridge the gap between quality athletic wear and personalized sports equipment,
                                    Sparrow Sports has evolved into a comprehensive platform that serves both everyday fitness enthusiasts
                                    and professional athletes.
                                </p>
                                <p className="text-lg text-gray-600 mb-6">
                                    What started as a simple idea to provide better sportswear has grown into an innovative e-commerce
                                    platform featuring custom design services, smart inventory management, and personalized shopping experiences.
                                </p>
                                <div className="flex items-center space-x-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <span className="text-2xl">🏆</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Excellence in Innovation</h3>
                                        <p className="text-gray-600">Pioneering custom design solutions in sportswear</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl text-white">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">10K+</div>
                                        <div className="text-sm opacity-80">Happy Customers</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">500+</div>
                                        <div className="text-sm opacity-80">Custom Designs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">50+</div>
                                        <div className="text-sm opacity-80">Brand Partners</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">99%</div>
                                        <div className="text-sm opacity-80">Satisfaction Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Makes Us Special</h2>
                            <p className="text-xl text-gray-600">Innovative features that set us apart from traditional sports retailers</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Custom Design Service */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-2xl">🎨</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Custom Design Service</h3>
                                <p className="text-gray-600 mb-4">
                                    Upload your designs and get custom sportswear manufactured with our advanced design-to-order system.
                                </p>
                                <ul className="text-sm text-gray-500 space-y-1">
                                    <li>• Price negotiation system</li>
                                    <li>• Real-time design approval</li>
                                    <li>• Quality guarantee</li>
                                </ul>
                            </div>

                            {/* Smart Notifications */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-2xl">🔔</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Stock Notifications</h3>
                                <p className="text-gray-600 mb-4">
                                    Never miss out on your favorite products with our intelligent stock notification system.
                                </p>
                                <ul className="text-sm text-gray-500 space-y-1">
                                    <li>• Variant-specific alerts</li>
                                    <li>• Instant notifications</li>
                                    <li>• Personalized recommendations</li>
                                </ul>
                            </div>

                            {/* Seller Dashboard */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Seller Tools</h3>
                                <p className="text-gray-600 mb-4">
                                    Comprehensive dashboard with analytics, inventory management, and order processing.
                                </p>
                                <ul className="text-sm text-gray-500 space-y-1">
                                    <li>• Real-time analytics</li>
                                    <li>• Inventory tracking</li>
                                    <li>• Customer insights</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission & Values */}
                <div className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Mission & Values</h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                We believe in empowering athletes and fitness enthusiasts with premium quality products
                                and innovative technology solutions.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl text-white">💪</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Quality First</h3>
                                <p className="text-sm text-gray-600">Premium materials and craftsmanship in every product</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl text-white">🚀</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Innovation</h3>
                                <p className="text-sm text-gray-600">Cutting-edge technology for better shopping experience</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl text-white">🤝</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Customer Focus</h3>
                                <p className="text-sm text-gray-600">Your satisfaction is our highest priority</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl text-white">🌱</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Sustainability</h3>
                                <p className="text-sm text-gray-600">Eco-friendly practices and sustainable sourcing</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technology Stack */}
                <div className="py-16 bg-gray-900 text-white">
                    <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built with Modern Technology</h2>
                            <p className="text-xl text-gray-300">
                                Powered by cutting-edge technologies for optimal performance and user experience
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="bg-blue-600 p-4 rounded-lg mb-4 inline-block">
                                    <span className="text-2xl font-bold">⚛️</span>
                                </div>
                                <h3 className="font-bold mb-2">Next.js 15 & React 19</h3>
                                <p className="text-sm text-gray-400">Latest frontend technologies for lightning-fast performance</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-green-600 p-4 rounded-lg mb-4 inline-block">
                                    <span className="text-2xl font-bold">🍃</span>
                                </div>
                                <h3 className="font-bold mb-2">MongoDB & Mongoose</h3>
                                <p className="text-sm text-gray-400">Scalable database solution for complex data relationships</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-purple-600 p-4 rounded-lg mb-4 inline-block">
                                    <span className="text-2xl font-bold">🔐</span>
                                </div>
                                <h3 className="font-bold mb-2">Clerk Authentication</h3>
                                <p className="text-sm text-gray-400">Enterprise-grade security and user management</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-orange-600 p-4 rounded-lg mb-4 inline-block">
                                    <span className="text-2xl font-bold">💳</span>
                                </div>
                                <h3 className="font-bold mb-2">Razorpay Integration</h3>
                                <p className="text-sm text-gray-400">Secure payment processing for Indian market</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-red-600 p-4 rounded-lg mb-4 inline-block">
                                    <span className="text-2xl font-bold">☁️</span>
                                </div>
                                <h3 className="font-bold mb-2">Cloudinary CDN</h3>
                                <p className="text-sm text-gray-400">Optimized image storage and delivery</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-yellow-600 p-4 rounded-lg mb-4 inline-block">
                                    <span className="text-2xl font-bold">⚡</span>
                                </div>
                                <h3 className="font-bold mb-2">Inngest Events</h3>
                                <p className="text-sm text-gray-400">Event-driven architecture for scalability</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="max-w-4xl mx-auto px-6 md:px-16 lg:px-32 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience the Future of Sports Shopping?</h2>
                        <p className="text-xl text-gray-200 mb-8">
                            Join thousands of satisfied customers who have made Sparrow Sports their go-to destination for premium athletic wear.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/all-products"
                                className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Shop Now
                            </a>
                            <a
                                href="/custom-design"
                                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                            >
                                Create Custom Design
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

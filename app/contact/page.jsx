import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 flex flex-col items-center justify-center py-16 px-4">
                <div className="w-full max-w-xl bg-white/90 rounded-2xl shadow-2xl p-10 backdrop-blur-md border border-white/40">
                    <h1 className="text-4xl font-bold text-center mb-6 text-gray-900">Contact Us</h1>
                    <p className="text-center text-gray-600 mb-8">
                        We'd love to hear from you! Fill out the form below and our team will get back to you as soon as possible.
                    </p>
                    <form className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Name</label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Your Name" required />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Email</label>
                            <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="you@email.com" required />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Message</label>
                            <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" rows={5} placeholder="How can we help you?" required></textarea>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">Send Message</button>
                    </form>
                    <div className="mt-10 text-center text-gray-500 text-sm">
                        <div>📞 +91 89408 85505</div>
                        <div>✉️ sparrowsports@gmail.com</div>
                        <div>📍 Namakkal, India</div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

'use client'
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { toast } from "react-hot-toast";
import { Mail, Phone, MapPin, Zap, Award, Users, Truck, Cog, Heart } from "lucide-react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.message.length > 1000) {
            toast.error('Message cannot exceed 1000 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check content type before parsing JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const responseText = await response.text();
                console.error('Non-JSON response:', responseText);
                throw new Error('Server returned non-JSON response');
            }

            const result = await response.json();

            if (result.success) {
                toast.success('Thank you! Your message has been sent successfully. We\'ll get back to you soon!');
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                });
            } else {
                toast.error(result.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            toast.error('Something went wrong. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Hero Section */}
            <div className="relative w-full h-80 bg-cover bg-center" style={{backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop)'}}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Get in Touch</h1>
                    <p className="text-white text-lg max-w-2xl px-4">
                        Our community is built on performance and shared passion. Whether you&apos;re a pro athlete or just starting your journey, our team is here to support your pursuit of excellence.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white">
                <div className="max-w-7xl mx-auto">
                    {/* Form and Contact Info Section */}
                    <div className="grid md:grid-cols-3 gap-12 mb-20">
                        {/* Contact Form */}
                        <div className="md:col-span-2">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">Send us a message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                                            placeholder="Your name"
                                            required
                                            disabled={isSubmitting}
                                            maxLength={100}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                                            placeholder="you@example.com"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                                        placeholder="How can we help?"
                                        required
                                        disabled={isSubmitting}
                                        maxLength={200}
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Message
                                        <span className="text-sm text-gray-500 ml-2">
                                            ({formData.message.length}/1000)
                                        </span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                                        rows={6}
                                        placeholder="Share your thoughts with us..."
                                        required
                                        disabled={isSubmitting}
                                        maxLength={1000}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                            <p className="text-gray-600 mb-8">
                                Have questions about our gear or your order? Reach out to our performance support team directly.
                            </p>

                            <div className="space-y-8">
                                {/* Email Support */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100">
                                            <Mail className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
                                        <p className="text-orange-600 font-medium">support@sparrowsports.com</p>
                                        <p className="text-sm text-gray-600">24/7 Response time</p>
                                    </div>
                                </div>

                                {/* Call Us */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100">
                                            <Phone className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                                        <p className="text-orange-600 font-medium">+91 89408 85505</p>
                                        <p className="text-sm text-gray-600">Mon-Fri 9am - 6pm IST</p>
                                    </div>
                                </div>

                                {/* Headquarters */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100">
                                            <MapPin className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Headquarters</h3>
                                        <p className="text-gray-700 font-medium">Sparrow Sports</p>
                                        <p className="text-sm text-gray-600">Namakkal, Tamil Nadu</p>
                                        <p className="text-sm text-gray-600">India</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visit Our Manufacturing Hub */}
                    <div className="mb-20">
                        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Visit Our Manufacturing Hub</h2>
                        <p className="text-center text-gray-600 mb-12">
                            Experience premium sportswear directly from the source. At Sparrow Sports, we specialize in manufacturing high-quality sports apparel in large quantities while also offering carefully selected premium sportswear for athletes, teams, retailers, and fitness enthusiasts.
                        </p>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Shop Images */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg overflow-hidden shadow-lg h-64 bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center relative">
                                    <Image src="https://images.unsplash.com/photo-1556821552-9e6878ffc335?w=400&h=300&fit=crop" alt="Manufacturing Facility" fill className="object-cover" />
                                </div>
                                <div className="rounded-lg overflow-hidden shadow-lg h-64 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative">
                                    <Image src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop" alt="Sports Gear Production" fill className="object-cover" />
                                </div>
                                <div className="rounded-lg overflow-hidden shadow-lg h-64 bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center col-span-2 relative">
                                    <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=300&fit=crop" alt="Sparrow Sports Hub" fill className="object-cover" />
                                </div>
                            </div>

                            {/* Manufacturing Description */}
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Sparrow Sports</h3>
                                <p className="text-gray-600 text-lg mb-6">
                                    Sparrow Sports is more than a sportswear store &mdash; we are a dedicated sportswear manufacturer focused on quality, comfort, durability, and performance. From bulk production for teams and businesses to premium ready-to-wear collections, we deliver products designed for active lifestyles and professional standards.
                                </p>
                                <p className="text-gray-600 text-lg mb-8">
                                    Whether you&apos;re looking for custom manufacturing, teamwear, wholesale orders, or premium sports apparel, our team is ready to help you find the right solution.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    {/* Feature 1 */}
                                    <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50">
                                                    <Zap className="h-6 w-6 text-orange-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 mb-1">Large-Scale Manufacturing</h4>
                                                <p className="text-gray-600 text-xs leading-tight">Bulk production with consistent quality.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature 2 */}
                                    <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                                                    <Award className="h-6 w-6 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 mb-1">Premium Collection</h4>
                                                <p className="text-gray-600 text-xs leading-tight">High-quality sports apparel for all.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature 3 */}
                                    <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50">
                                                    <Cog className="h-6 w-6 text-purple-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 mb-1">Custom Orders</h4>
                                                <p className="text-gray-600 text-xs leading-tight">Tailored solutions for teams & events.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature 4 */}
                                    <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50">
                                                    <Heart className="h-6 w-6 text-emerald-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 mb-1">Quality Assured</h4>
                                                <p className="text-gray-600 text-xs leading-tight">Crafted for durability & performance.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature 5 */}
                                    <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50">
                                                    <Users className="h-6 w-6 text-indigo-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 mb-1">Expert Team</h4>
                                                <p className="text-gray-600 text-xs leading-tight">Support for bulk orders & customization.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature 6 */}
                                    <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-rose-100 to-rose-50">
                                                    <Truck className="h-6 w-6 text-rose-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-gray-900 mb-1">Reliable Delivery</h4>
                                                <p className="text-gray-600 text-xs leading-tight">Smooth ordering & timely production.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                                    Visit Sparrow Sports
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ CTA Section */}
            <div className="bg-orange-600 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Need a quick answer?</h2>
                    <p className="text-white text-lg mb-8">
                        Browse our comprehensive Help Center for questions about sizing, technical gear care, and order tracking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/faq" className="bg-white text-orange-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
                            Visit Help Center
                        </Link>
                        <Link href="/faq" className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:bg-opacity-10 transition">
                            FAQs
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

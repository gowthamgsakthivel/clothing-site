import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Oswald, Sora } from "next/font/google";

const headingFont = Oswald({ subsets: ["latin"], weight: ["400", "600", "700"] });
const bodyFont = Sora({ subsets: ["latin"], weight: ["300", "400", "600"] });

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
            <div className={`min-h-screen bg-[#f7f4ef] text-[#0b0f12] ${bodyFont.className}`}>
                {/* Hero */}
                <section className="relative overflow-hidden bg-[#0b0f12] text-white">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_50%)]" />
                        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/60 to-black/20" />
                    </div>
                    <div className="relative mx-auto max-w-6xl px-6 md:px-12 lg:px-16 py-16 md:py-24">
                        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                            <div>
                                <p className="text-xs tracking-[0.4em] text-orange-400 uppercase">Engineered for excellence</p>
                                <h1 className={`${headingFont.className} mt-4 text-4xl md:text-6xl font-semibold leading-tight`}>
                                    Born for performance. Built for purpose.
                                </h1>
                                <p className="mt-5 max-w-xl text-sm md:text-base text-gray-200">
                                    Sparrow Sports designs apparel that moves with you. From custom kits to everyday training gear, we blend
                                    athlete-first engineering with bold, modern style.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-4">
                                    <a
                                        href="/sports"
                                        className="inline-flex items-center justify-center bg-orange-600 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500"
                                    >
                                        Explore the collection
                                    </a>
                                    <a
                                        href="/custom-design"
                                        className="inline-flex items-center justify-center border border-white/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:border-white"
                                    >
                                        Custom design
                                    </a>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-6 -top-6 h-24 w-24 bg-orange-600" />
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-white/10 shadow-2xl">
                                    <Image
                                        src="/assets/img/running.png"
                                        alt="Runner in Sparrow Sports gear"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                </div>
                                <div className="absolute -bottom-6 right-0 bg-orange-600 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">
                                    Est. 2018
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story */}
                <section className="bg-white">
                    <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-16 py-16">
                        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Origins</p>
                                <h2 className={`${headingFont.className} mt-3 text-3xl md:text-4xl font-semibold`}>Our Story</h2>
                                <p className="mt-5 text-sm md:text-base text-gray-600">
                                    Sparrow Sports began with a simple mission: deliver performance wear that feels personal. We obsess over
                                    fabric, fit, and functionality so every athlete can train with confidence.
                                </p>
                                <p className="mt-4 text-sm md:text-base text-gray-600">
                                    Today we serve teams, creators, and everyday competitors with custom sportswear, stock notifications, and
                                    a design workflow that turns ideas into gear.
                                </p>
                            </div>
                            <div className="relative">
                                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-gray-200 shadow-lg">
                                    <Image
                                        src="/assets/img/cricket_jersey.png"
                                        alt="Technical sports fabric detail"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                    />
                                </div>
                                <div className="absolute -bottom-4 left-6 bg-orange-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">
                                    Crafted in India
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Engineering */}
                <section className="bg-[#f7f4ef]">
                    <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-16 py-16">
                        <div className="text-center">
                            <p className="text-xs uppercase tracking-[0.35em] text-orange-600">The science of movement</p>
                            <h2 className={`${headingFont.className} mt-3 text-3xl md:text-4xl font-semibold`}>Engineering & Innovation</h2>
                        </div>
                        <div className="mt-10 grid gap-6 md:grid-cols-3">
                            {[
                                {
                                    title: "Moisture-wicking",
                                    body: "Dry-fast blends pull sweat away so you stay light and focused during intense sessions.",
                                },
                                {
                                    title: "Custom-fit build",
                                    body: "Sizes, colors, and prints dialed for teams and individuals with precise production control.",
                                },
                                {
                                    title: "Sustainable performance",
                                    body: "We prioritize long-wear fabrics and low-waste production for a lighter footprint.",
                                },
                            ].map((item) => (
                                <div key={item.title} className="border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="h-1 w-12 bg-orange-600" />
                                    <h3 className={`${headingFont.className} mt-5 text-lg font-semibold`}>{item.title}</h3>
                                    <p className="mt-3 text-sm text-gray-600">{item.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission */}
                <section className="bg-[#0b0f12] text-white">
                    <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-16 py-16 text-center">
                        <p className="text-xs uppercase tracking-[0.35em] text-orange-400">The drive</p>
                        <h2 className={`${headingFont.className} mt-3 text-3xl md:text-4xl font-semibold`}>Our Mission</h2>
                        <p className="mt-5 text-sm md:text-base text-gray-200">
                            To empower every athlete to express their identity and perform at their peak with gear that never compromises on
                            quality, comfort, or craftsmanship.
                        </p>
                    </div>
                </section>

                {/* Core Values */}
                <section className="bg-white">
                    <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-16 py-16">
                        <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Culture</p>
                        <h2 className={`${headingFont.className} mt-3 text-3xl md:text-4xl font-semibold`}>Our Core Values</h2>
                        <div className="mt-10 grid gap-6 md:grid-cols-4">
                            {[
                                {
                                    number: "01",
                                    title: "Authenticity",
                                    body: "We build gear for real athletes with real stories.",
                                },
                                {
                                    number: "02",
                                    title: "Innovation",
                                    body: "Constant evolution of fit, fabric, and fulfillment.",
                                },
                                {
                                    number: "03",
                                    title: "Impact",
                                    body: "We grow community-first and support local teams.",
                                },
                                {
                                    number: "04",
                                    title: "Integrity",
                                    body: "Quality manufacturing and honest relationships.",
                                },
                            ].map((value) => (
                                <div key={value.number} className="border border-gray-200 bg-[#f7f4ef] p-6">
                                    <p className="text-2xl text-orange-300 font-semibold">{value.number}</p>
                                    <h3 className={`${headingFont.className} mt-4 text-lg font-semibold`}>{value.title}</h3>
                                    <p className="mt-2 text-sm text-gray-600">{value.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="bg-[#f7f4ef]">
                    <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-16 py-16">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-orange-600">The collective</p>
                                <h2 className={`${headingFont.className} mt-3 text-3xl md:text-4xl font-semibold`}>Meet the Team</h2>
                            </div>
                            <a href="/contact" className="text-xs uppercase tracking-[0.3em] text-orange-600">Join the team</a>
                        </div>
                        <div className="mt-10 grid gap-6 md:grid-cols-3">
                            {[
                                {
                                    name: "Arjun Kumar",
                                    role: "Founder & CEO",
                                    image: "/assets/img/running.png",
                                },
                                {
                                    name: "Meera Nair",
                                    role: "Head of Innovation",
                                    image: "/assets/img/upper.png",
                                },
                                {
                                    name: "Rahul Singh",
                                    role: "Lead Developer",
                                    image: "/assets/img/cricket_jersey.png",
                                },
                            ].map((person) => (
                                <div key={person.name} className="bg-white shadow-sm">
                                    <div className="relative aspect-[3/4] overflow-hidden">
                                        <Image
                                            src={person.image}
                                            alt={person.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 30vw"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                                        <p className="text-xs text-gray-500">{person.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-[#0b0f12] text-white">
                    <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-16 py-16 text-center">
                        <h2 className={`${headingFont.className} text-3xl md:text-4xl font-semibold`}>
                            Ready to outfit your next win?
                        </h2>
                        <p className="mt-4 text-sm md:text-base text-gray-200">
                            Discover premium sportswear, custom kits, and training essentials built for athletes who show up.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <a
                                href="/all-products"
                                className="inline-flex items-center justify-center bg-orange-600 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500"
                            >
                                Shop now
                            </a>
                            <a
                                href="/custom-design"
                                className="inline-flex items-center justify-center border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:border-white"
                            >
                                Create your kit
                            </a>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    )
}

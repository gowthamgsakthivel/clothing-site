import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";

const outfit = Outfit({ subsets: ['latin'], weight: ["300", "400", "500"] })

export const metadata = {
  metadataBase: new URL('https://sparrow-sports.vercel.app'),
  title: {
    template: '%s | Sparrow Sports',
    default: 'Sparrow Sports - Premium Athletic Wear',
  },
  description: "Customize your sports wear with premium quality athletic apparel for all your fitness activities. Shop stylish and functional sportswear at Sparrow Sports.",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Sparrow Sports - Premium Athletic Wear",
    description: "Customize your sports wear with premium quality athletic apparel for all your fitness activities. Shop stylish and functional sportswear at Sparrow Sports.",
    url: 'https://sparrow-sports.vercel.app',
    siteName: 'Sparrow Sports',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Sparrow Sports Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparrow Sports - Premium Athletic Wear',
    description: 'Customize your sports wear with premium quality athletic apparel for all your fitness activities.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

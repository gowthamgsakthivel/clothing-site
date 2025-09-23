'use client';

import { useEffect } from 'react';

/**
 * SEOMetadata - Client-side component for managing page metadata
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The page title
 * @param {string} props.description - The page description
 * @param {string} props.keywords - Keywords for the page
 * @param {string} props.url - The canonical URL for the page
 * @param {string} props.imageUrl - The URL of the image to use for social sharing
 * @param {string} props.imageAlt - The alt text for the social sharing image
 * @param {boolean} props.noindex - Whether to prevent search engines from indexing this page
 * @param {Object} props.product - Product data for product schema (optional)
 * @param {Object} props.organization - Organization data for organization schema (optional)
 */
export default function SEOMetadata({
    title,
    description,
    keywords,
    url = "",
    imageUrl = "/logo.svg",
    imageAlt = "Sparrow Sports",
    noindex = false,
    product = null,
    organization = {
        name: "Sparrow Sports",
        logo: "/logo.svg",
        url: "https://sparrow-sports.vercel.app"
    }
}) {
    useEffect(() => {
        // Update the document title
        if (title) {
            document.title = title;
        }

        // Find or create meta description tag
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        if (description) {
            metaDescription.content = description;
        }

        // Find or create meta keywords tag
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        if (keywords) {
            metaKeywords.content = keywords;
        }

        // Find or create canonical URL
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
        }
        if (url) {
            // Ensure URL is absolute by checking if it starts with http
            if (url.startsWith('/')) {
                canonicalLink.href = `${window.location.origin}${url}`;
            } else {
                canonicalLink.href = url;
            }
        }

        // Add robots meta tag for noindex if needed
        if (noindex) {
            let metaRobots = document.querySelector('meta[name="robots"]');
            if (!metaRobots) {
                metaRobots = document.createElement('meta');
                metaRobots.name = 'robots';
                document.head.appendChild(metaRobots);
            }
            metaRobots.content = 'noindex, nofollow';
        }

        // Add Schema.org structured data
        let scriptTag = document.querySelector('#schema-org-script');
        if (scriptTag) {
            document.head.removeChild(scriptTag);
        }

        scriptTag = document.createElement('script');
        scriptTag.id = 'schema-org-script';
        scriptTag.type = 'application/ld+json';

        // Default organization schema
        let schemaData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": organization.name,
            "logo": organization.logo.startsWith('/') ? `${window.location.origin}${organization.logo}` : organization.logo,
            "url": organization.url.startsWith('/') ? `${window.location.origin}${organization.url}` : organization.url,
            "sameAs": [
                "https://www.facebook.com/sparrowsports",
                "https://www.instagram.com/sparrowsports",
                "https://twitter.com/sparrowsports"
            ]
        };

        // If this is a product page, add product schema
        if (product) {
            schemaData = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.description,
                "image": product.image.startsWith('/') ? `${window.location.origin}${product.image}` : product.image,
                "sku": product.sku || product._id,
                "mpn": product._id,
                "brand": {
                    "@type": "Brand",
                    "name": product.brand || "Sparrow Sports"
                },
                "offers": {
                    "@type": "Offer",
                    "url": url.startsWith('/') ? `${window.location.origin}${url}` : url,
                    "priceCurrency": "INR",
                    "price": product.new_price || product.offerPrice,
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "itemCondition": "https://schema.org/NewCondition"
                }
            };

            // Add reviews if available
            if (product.ratings && product.ratings.length > 0) {
                const totalRating = product.ratings.reduce((sum, rating) => sum + rating.stars, 0);
                const avgRating = totalRating / product.ratings.length;

                schemaData.aggregateRating = {
                    "@type": "AggregateRating",
                    "ratingValue": avgRating.toFixed(1),
                    "reviewCount": product.ratings.length
                };
            }
        }

        scriptTag.textContent = JSON.stringify(schemaData);
        document.head.appendChild(scriptTag);

        // Cleanup function
        return () => {
            if (scriptTag && document.head.contains(scriptTag)) {
                document.head.removeChild(scriptTag);
            }
        };
    }, [title, description, keywords, url, noindex, product]);

    // This component doesn't render anything visible
    return null;
}
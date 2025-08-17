import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterCreator?: string;
  jsonLd?: object;
  robots?: string;
}

const defaultSEO = {
  title: 'Veilo - Your Mental Health Support Platform',
  description: 'Connect with verified mental health experts, join supportive communities, and access AI-powered tools for anxiety, depression, stress management and emotional wellness.',
  keywords: 'mental health, therapy, counseling, anxiety support, depression help, emotional wellness, AI therapy, online counseling, stress management, mindfulness',
  ogType: 'website',
  ogImage: '/veilo-og-image.png',
  twitterCard: 'summary_large_image',
  twitterCreator: '@VeiloApp',
  robots: 'index, follow'
};

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  twitterCard,
  twitterCreator,
  jsonLd,
  robots
}) => {
  const location = useLocation();

  // Auto-generate canonical URL if not provided
  const canonicalUrl = canonical || `${window.location.origin}${location.pathname}`;

  // Merge with defaults
  const seoData = {
    title: title || defaultSEO.title,
    description: description || defaultSEO.description,
    keywords: keywords || defaultSEO.keywords,
    ogTitle: ogTitle || title || defaultSEO.title,
    ogDescription: ogDescription || description || defaultSEO.description,
    ogImage: ogImage || defaultSEO.ogImage,
    ogType: ogType || defaultSEO.ogType,
    twitterCard: twitterCard || defaultSEO.twitterCard,
    twitterCreator: twitterCreator || defaultSEO.twitterCreator,
    robots: robots || defaultSEO.robots
  };

  // Generate JSON-LD structured data
  const generateJsonLd = () => {
    if (jsonLd) return jsonLd;

    // Default organization schema
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Veilo",
      "description": "Mental health support platform connecting users with verified experts",
      "url": window.location.origin,
      "logo": `${window.location.origin}/veilo-logo.png`,
      "sameAs": [
        "https://twitter.com/VeiloApp",
        "https://facebook.com/VeiloApp",
        "https://linkedin.com/company/veilo"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Spanish", "French"],
        "areaServed": "Worldwide"
      }
    };
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      <meta name="robots" content={seoData.robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={seoData.ogTitle} />
      <meta property="og:description" content={seoData.ogDescription} />
      <meta property="og:type" content={seoData.ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={seoData.ogImage} />
      <meta property="og:site_name" content="Veilo" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={seoData.twitterCard} />
      <meta name="twitter:creator" content={seoData.twitterCreator} />
      <meta name="twitter:title" content={seoData.ogTitle} />
      <meta name="twitter:description" content={seoData.ogDescription} />
      <meta name="twitter:image" content={seoData.ogImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateJsonLd())}
      </script>

      {/* Additional Meta Tags for Mental Health Context */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};

// Hook for dynamic SEO updates
export const useSEO = (seoProps: SEOProps) => {
  useEffect(() => {
    // Update page title in browser tab
    if (seoProps.title) {
      document.title = seoProps.title;
    }
  }, [seoProps.title]);
};

// Page-specific SEO configurations
export const pageSEOConfigs = {
  home: {
    title: 'Veilo - AI-Powered Mental Health Support Platform',
    description: 'Get personalized mental health support with AI-powered expert matching, anonymous sanctuaries, and verified professional guidance. Start your healing journey today.',
    keywords: 'AI mental health, therapy matching, anonymous support, mental wellness platform, anxiety help, depression support',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Veilo",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web Browser",
      "description": "AI-powered mental health support platform",
      "url": window.location.origin,
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  },

  beacons: {
    title: 'Find Verified Mental Health Experts | Veilo Beacons',
    description: 'Connect with compassionate, verified mental health professionals. AI-powered matching helps you find the perfect expert for anxiety, depression, stress management, and more.',
    keywords: 'mental health experts, verified therapists, anxiety support, depression help, stress management, online therapy, AI matching',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Verified Mental Health Experts",
      "description": "List of verified mental health professionals available on Veilo",
      "numberOfItems": "50+",
      "itemListElement": []
    }
  },

  sanctuary: {
    title: 'Anonymous Mental Health Support | Veilo Sanctuary',
    description: 'Join safe, anonymous mental health support spaces. Share experiences, get guidance, and connect with others in live audio sessions or text-based sanctuaries.',
    keywords: 'anonymous mental health, support groups, safe space, mental health community, peer support, anonymous therapy',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Veilo Sanctuary",
      "description": "Anonymous mental health support spaces",
      "provider": {
        "@type": "Organization",
        "name": "Veilo"
      },
      "serviceType": "Mental Health Support"
    }
  },

  expertProfile: {
    title: 'Expert Profile | Veilo',
    description: 'Learn more about our verified mental health professionals, their specializations, and user reviews.',
    keywords: 'mental health expert, therapist profile, counselor, psychological support, expert credentials'
  }
};

export default SEOHead;
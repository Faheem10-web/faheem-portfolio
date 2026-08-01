import { useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';

export default function SeoHeadManager() {
  const { siteSettings } = useAdmin();
  const seo = siteSettings?.seo || {};

  useEffect(() => {
    if (!seo) return;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    // 1. Document Title
    const titleText = seo.siteTitle || 'Faheem - Premium UI/UX Portfolio';
    document.title = titleText;

    // Helper to upsert meta tag by name or property attribute
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content && content !== '') return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to upsert link tag by rel attribute
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard SEO Meta Tags
    setMetaTag('name', 'description', seo.metaDescription || '');
    
    const keywordsStr = Array.isArray(seo.keywords) 
      ? seo.keywords.join(', ') 
      : (seo.keywords || '');
    setMetaTag('name', 'keywords', keywordsStr);
    
    setMetaTag('name', 'author', seo.author || 'Faheem');
    setMetaTag('name', 'robots', seo.robotsIndex || 'index, follow');

    // 3. Canonical Link
    const canonical = seo.canonicalUrl || currentUrl;
    setLinkTag('canonical', canonical);

    // 4. Open Graph Meta Tags (Facebook, WhatsApp, LinkedIn, Discord, iMessage)
    const ogTitle = seo.ogTitle || titleText;
    const ogDesc = seo.ogDescription || seo.metaDescription || '';
    const ogImg = seo.ogImage || '';

    setMetaTag('property', 'og:site_name', 'Faheem Portfolio');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', ogTitle);
    setMetaTag('property', 'og:description', ogDesc);
    setMetaTag('property', 'og:url', canonical || currentUrl);
    if (ogImg) {
      setMetaTag('property', 'og:image', ogImg);
      setMetaTag('property', 'og:image:secure_url', ogImg);
      setMetaTag('property', 'og:image:width', '1200');
      setMetaTag('property', 'og:image:height', '630');
    }

    // 5. Twitter Card Meta Tags
    const twitterImg = seo.twitterUseOgImage !== false ? (ogImg || seo.twitterImage) : (seo.twitterImage || ogImg);
    const twitterTitle = seo.twitterTitle || ogTitle;
    const twitterDesc = seo.twitterDescription || ogDesc;
    const twitterCardType = seo.twitterCardType || 'summary_large_image';

    setMetaTag('name', 'twitter:card', twitterCardType);
    setMetaTag('name', 'twitter:title', twitterTitle);
    setMetaTag('name', 'twitter:description', twitterDesc);
    if (twitterImg) {
      setMetaTag('name', 'twitter:image', twitterImg);
    }

    // 6. Favicon Dynamic Linking
    if (seo.favicon) {
      setLinkTag('icon', seo.favicon);
      setLinkTag('shortcut icon', seo.favicon);
      setLinkTag('apple-touch-icon', seo.favicon);
    }
  }, [seo]);

  return null;
}

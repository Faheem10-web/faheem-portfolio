/**
 * Image Optimizer Utility for Cloudinary and local assets.
 * Embeds dynamic auto-formatting (f_auto), quality optimization (q_auto),
 * and width scaling parameters into Cloudinary URLs.
 */

export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return '';

  const { width, quality = 'auto', format = 'auto' } = options;

  // Cloudinary image processing
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Avoid double transformation insertion
    if (url.includes('/upload/f_auto,q_auto/')) {
      if (width) {
        return url.replace('/upload/f_auto,q_auto/', `/upload/f_${format},q_${quality},w_${width},c_limit/`);
      }
      return url;
    }

    const transformations = [`f_${format}`, `q_${quality}`];
    if (width) {
      transformations.push(`w_${width}`, 'c_limit');
    }

    const transformStr = `/upload/${transformations.join(',')}/`;
    return url.replace('/upload/', transformStr);
  }

  return url;
}

export function getSrcSet(url, widths = [400, 800, 1200]) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

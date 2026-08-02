/**
 * Ultra-Fast Image Optimizer Utility for Cloudinary and local assets.
 * Embeds dynamic auto-formatting (f_auto), quality optimization (q_auto),
 * dpr_auto, and responsive width scaling parameters into Cloudinary URLs.
 */

export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return '';

  const { width, quality = 'auto', format = 'auto', dpr = 'auto', version, updatedAt } = options;

  let finalUrl = url;

  // Cloudinary image processing
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Strip existing transformations if present to avoid duplication
    const cleanUrl = url.replace(/\/upload\/(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//, '/upload/');

    const transformations = [`f_${format}`, `q_${quality}`, `dpr_${dpr}`];
    if (width) {
      transformations.push(`w_${width}`, 'c_limit');
    }

    const transformStr = `/upload/${transformations.join(',')}/`;
    finalUrl = cleanUrl.replace('/upload/', transformStr);
  }

  // Preserve or append version timestamp for cache busting
  const ts = version || (updatedAt ? new Date(updatedAt).getTime() : null);
  if (ts && !finalUrl.includes('v=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}v=${ts}`;
  }

  return finalUrl;
}

export function getSrcSet(url, widths = [400, 600, 800, 1200, 1600]) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

export function getBlurPlaceholderUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return '';
  }

  return getOptimizedImageUrl(url, { width: 30, quality: 10 });
}

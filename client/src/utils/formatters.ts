export function formatRoleLabel(role?: string | null): string {
  if (!role) return '';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function optimizeCloudinaryUrl(url: string | undefined | null, width: number = 600, height?: number): string {
  if (!url) return '';
  
  // Handle local uploads or hardcoded localhost URLs
  if (url.startsWith('/uploads/') || url.includes('localhost:5000/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://shopping-app-mocha-six.vercel.app/api/v1';
    const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    const uploadPath = url.includes('/uploads/') ? url.substring(url.indexOf('/uploads/')) : url;
    return `${backendUrl}${uploadPath}`;
  }

  if (!url.includes('res.cloudinary.com')) return url;
  
  // E.g. https://res.cloudinary.com/demo/image/upload/v1612345/sample.jpg
  // Target: https://res.cloudinary.com/demo/image/upload/w_600,q_auto,f_auto/v1612345/sample.jpg
  
  const transforms = height ? `w_${width},h_${height},c_fill,q_auto,f_auto` : `w_${width},c_fill,q_auto,f_auto`;
  return url.replace('/upload/', `/upload/${transforms}/`);
}

export function formatRoleLabel(role?: string | null): string {
  if (!role) return '';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function optimizeCloudinaryUrl(url: string | undefined | null, width: number = 600, height?: number): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  
  // E.g. https://res.cloudinary.com/demo/image/upload/v1612345/sample.jpg
  // Target: https://res.cloudinary.com/demo/image/upload/w_600,q_auto,f_auto/v1612345/sample.jpg
  
  const transforms = height ? `w_${width},h_${height},c_fill,q_auto,f_auto` : `w_${width},c_fill,q_auto,f_auto`;
  return url.replace('/upload/', `/upload/${transforms}/`);
}

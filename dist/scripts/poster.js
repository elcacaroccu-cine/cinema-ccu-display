export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validatePosterFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw Error('Selecciona una imagen JPG, PNG o WebP.');
  }
  if (!file.size || file.size > MAX_UPLOAD_BYTES) {
    throw Error('La imagen debe pesar entre 1 byte y 10 MB.');
  }
}

export async function preparePoster(file) {
  validatePosterFile(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let poster = canvas.toDataURL('image/jpeg', 0.82);
    if (poster.length > 450000) poster = canvas.toDataURL('image/jpeg', 0.60);
    if (poster.length > 650000) {
      throw Error('La imagen tiene demasiado detalle. Elige una versión más pequeña.');
    }
    return poster;
  } finally {
    URL.revokeObjectURL(url);
  }
}

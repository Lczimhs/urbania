// Lê uma imagem (JPG/PNG) e devolve um data URL reduzido, para não pesar no banco.
export const imageToDataUrl = (file: File, maxSize = 1280): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

// Fotos de imóvel ficam salvas como uma lista JSON em uma coluna de texto
export const parsePhotos = (v: unknown): string[] => {
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(String(v || '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const extractImageFromDrop = async (e: React.DragEvent): Promise<string | null> => {
  // 1. Check for local files dropped
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
  }

  // 2. Check for image URLs dropped from web / other browser windows
  const uriList = e.dataTransfer.getData('text/uri-list');
  if (uriList && uriList.trim()) {
    const lines = uriList.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/'))) {
        return trimmed;
      }
    }
  }

  const plainText = e.dataTransfer.getData('text/plain');
  if (plainText && plainText.trim()) {
    const url = plainText.trim();
    if (url.match(/^https?:\/\/.*$/i) || url.startsWith('data:image/')) {
      return url;
    }
  }

  // 3. Fallback check for item files
  if (e.dataTransfer.items) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const item = e.dataTransfer.items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        }
      }
    }
  }

  return null;
};

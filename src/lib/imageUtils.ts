/**
 * Utility to compress and resize images on the client before upload.
 * Reduces 5MB+ smartphone screenshots down to ~80-150KB for rapid uploading over weak mobile networks.
 */
export function compressAndResizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75,
  onProgress?: (percent: number, statusText: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    onProgress?.(15, 'جاري قراءة صورة الإشعار...');
    
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = (e) => {
      onProgress?.(40, 'جاري معالجة وضغط الصورة وتقليل حجمها للشبكات الضعيفة...');
      
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate fitted dimensions preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onProgress?.(100, 'اكتملت المعالجة');
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        onProgress?.(80, 'جاري تجهيز الصورة بجودة عالية وحجم خفيف جداً...');
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        onProgress?.(100, 'تم ضغط ومعالجة الصورة بنجاح!');
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

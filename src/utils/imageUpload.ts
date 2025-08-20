
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";

export const compressImage = async (file: File, quality: number = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxSize = 1600; // keep images reasonably sized
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height >= width && height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Could not get canvas context"));
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            return reject(new Error("Failed to compress image"));
          }
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

export interface UploadProductImageOptions {
  productId?: string;
  productName?: string;
  subfolder?: string; // default: "products"
}

export const uploadProductImage = async (
  file: File,
  options: UploadProductImageOptions = {}
): Promise<{ publicUrl: string; path: string }> => {
  const compressed = await compressImage(file);
  const folder = options.subfolder || "products";
  const namePart =
    options.productId ||
    (options.productName ? slugify(options.productName) : "item");
  const timestamp = Date.now();
  const fileName = `${folder}/${namePart}-${timestamp}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, compressed, {
      upsert: false,
      contentType: "image/jpeg",
    });

  if (error) throw new Error(error.message);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return { publicUrl: pub.publicUrl, path: fileName };
};

const extractPathFromPublicUrl = (url: string): string | null => {
  // Expected: .../storage/v1/object/public/product-images/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
};

export const deleteProductImageByUrl = async (publicUrl: string): Promise<void> => {
  const path = extractPathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
};

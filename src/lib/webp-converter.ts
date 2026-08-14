/**
 * Conversion d'images vers WebP côté client.
 * Utilise <canvas> pour encoder en WebP avec qualité configurable.
 */

const WEBP_QUALITY = 0.8; // 80% — bon équilibre qualité/poids
const MAX_DIMENSION = 2048; // Redimensionner si plus grand

export interface ConversionResult {
  blob: Blob;
  originalName: string;
  webpName: string;
  originalSize: number;
  webpSize: number;
}

/**
 * Convertit un fichier image (jpg/png) en WebP.
 * Redimensionne si nécessaire (max 2048px).
 */
export async function convertToWebP(file: File): Promise<ConversionResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier n'est pas une image");
  }

  const originalSize = file.size;

  // Charger l'image
  const bitmap = await createImageBitmap(file);

  // Calculer les dimensions
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Dessiner sur canvas et encoder en WebP
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context indisponible");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Blob WebP
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Échec de l'encodage WebP"));
      },
      "image/webp",
      WEBP_QUALITY
    );
  });

  // Nom du fichier
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const webpName = `${baseName}.webp`;

  return {
    blob,
    originalName: file.name,
    webpName,
    originalSize,
    webpSize: blob.size,
  };
}

/**
 * Upload vers Supabase Storage (bucket: documents).
 */
export async function uploadDocumentWebP(
  blob: Blob,
  fileName: string,
  consultationId: string
): Promise<string> {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();

  const path = `${consultationId}/${fileName}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, blob, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) throw error;

  // Récupérer l'URL publique
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Supprimer un document du bucket.
 */
export async function deleteDocumentWebP(path: string): Promise<void> {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();

  const { error } = await supabase.storage.from("documents").remove([path]);
  if (error) throw error;
}
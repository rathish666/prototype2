import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'maison-auth',
    flowType: 'password',
  },
});

export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function isAbsoluteUrl(url?: string | null) {
  return !!url && /^https?:\/\//i.test(url);
}

export function resolveProductImageUrl(urlOrPath?: string | null) {
  if (!urlOrPath) return '';
  if (isAbsoluteUrl(urlOrPath)) return urlOrPath;
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(urlOrPath);
  return data?.publicUrl ?? '';
}

export function getPublicImageUrl(filePath: string) {
  const result = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);
  return {
    publicUrl: result.data?.publicUrl ?? '',
    error: 'error' in result ? result.error : undefined,
  };
}

export function normalizeProductImageUrl(urlOrPath?: string | null) {
  return resolveProductImageUrl(urlOrPath);
}

export async function uploadProductImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    throw new Error('Unsupported image type. Only JPG, PNG, and WEBP are allowed.');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }

  const extension = file.type.split('/').pop() ?? 'jpg';
  const path = `products/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    throw new Error(`Image upload failed (${file.name}): ${uploadError.message}`);
  }

  const { publicUrl, error: publicUrlError } = getPublicImageUrl(path);
  if (publicUrlError || !publicUrl) {
    throw new Error(`Public URL generation failed for uploaded image: ${publicUrlError ?? 'unknown error'}`);
  }

  return publicUrl;
}

export function extractStoragePathFromPublicUrl(publicUrl?: string | null) {
  if (!publicUrl || !isAbsoluteUrl(publicUrl)) return null;
  try {
    const parsedUrl = new URL(publicUrl);
    const projectOrigin = new URL(supabaseUrl).origin;
    if (parsedUrl.origin !== projectOrigin) return null;
    const prefix = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    if (!parsedUrl.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export async function deleteProductImageUrl(publicUrl: string) {
  const path = extractStoragePathFromPublicUrl(publicUrl);
  if (!path) {
    return { success: false, error: new Error('Public URL is not a Supabase product-images URL.') };
  }

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  return { success: !error, error };
}

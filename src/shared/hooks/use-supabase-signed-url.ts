"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const DEFAULT_EXPIRES_IN = 60 * 60;

export function useSupabaseSignedUrl(
  bucket: string,
  storagePath: string | null | undefined,
  expiresIn: number = DEFAULT_EXPIRES_IN,
): { url: string | null; loading: boolean; error: string | null } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn)
      .then(({ data, error: signError }) => {
        if (cancelled) return;
        if (signError) {
          setError(signError.message);
          setUrl(null);
        } else {
          setUrl(data?.signedUrl ?? null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao gerar URL");
        setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, storagePath, expiresIn]);

  return { url, loading, error };
}

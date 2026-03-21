"use client";

// Controller returns: { signature: SignatureHttpResponse }
// GET /documents/:id/signature
// 404 = unsigned (not an error — treat as null)

import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export interface SignatureDTO {
  id: string;
  documentId: string;
  signedBy: string; // clientId
  signatureImageKey: string; // blob key e.g. "signatures/{documentId}/{uuid}.png"
  ipAddress: string | null;
  userAgent: string | null;
  signedAt: string; // ISO date string
}

async function fetchSignature(documentId: string): Promise<SignatureDTO | null> {
  const token = Cookies.get("auth_token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/documents/${documentId}/signature`, {
    method: "GET",
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status === 401) {
    Cookies.remove("auth_token");
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An unexpected error occurred",
    }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  const data = await response.json() as { signature: SignatureDTO };
  return data.signature;
}

export function useSignature(documentId: string) {
  return useQuery({
    queryKey: ["signature", documentId],
    queryFn: () => fetchSignature(documentId),
    enabled: !!documentId,
  });
}

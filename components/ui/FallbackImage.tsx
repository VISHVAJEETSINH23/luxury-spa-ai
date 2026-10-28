"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK = "/images/ritual-basalt.jpg";

/** next/image that swaps to a house photo if the requested one fails to load. */
export default function FallbackImage({ src, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  return <Image {...props} src={failed ? FALLBACK : src} onError={() => setFailed(true)} />;
}

"use client";

import { useEffect } from "react";

/**
 * Reports this embed's content height to the parent window so a host page
 * can size the iframe without a scrollbar. Paired with the listener script
 * generated alongside the iframe snippet in the embed code generator.
 */
export default function EmbedAutoResize() {
  useEffect(() => {
    const postHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent?.postMessage({ source: "eventful-embed", type: "resize", height }, "*");
    };

    postHeight();

    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);

    return () => observer.disconnect();
  }, []);

  return null;
}

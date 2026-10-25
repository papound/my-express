"use client";

import { useEffect, useState } from "react";

export function useSignatureVersion() {
  const [version, setVersion] = useState<number>(() => Date.now());

  useEffect(() => {
    const handleUpdate = () => {
      setVersion(Date.now());
    };
    window.addEventListener("express-signatures-updated", handleUpdate);
    return () => {
      window.removeEventListener("express-signatures-updated", handleUpdate);
    };
  }, []);

  return version;
}


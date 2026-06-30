"use client";

import { useEffect } from "react";

let installed = false;

export function MockApiProvider() {
  useEffect(() => {
    if (installed) return;
    installed = true;
    import("@/lib/mock-api").then((m) => m.installMockApi());
  }, []);
  return null;
}

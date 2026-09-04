import { useEffect } from "react";
import { toast } from "sonner";
import { usePlaybook } from "@/lib/playbook/store";

export function HydrateDesk() {
  useEffect(() => {
    usePlaybook
      .getState()
      .hydrateFromServer()
      .catch((err: unknown) => {
        console.error("[contract-radar] initial hydrate failed:", err);
        toast.error("Couldn't load from the server — check your connection and reload.");
      });
  }, []);

  return null;
}

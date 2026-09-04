import { useEffect } from "react";
import { usePlaybook } from "@/lib/playbook/store";

export function HydrateDesk() {
  useEffect(() => {
    const run = () => {
      const s = usePlaybook.getState();
      s.hydrateIfEmpty();
      s.markReady();
    };
    run();
    const unsub = usePlaybook.persist.onFinishHydration(run);
    const t = window.setTimeout(run, 80);
    return () => {
      unsub?.();
      window.clearTimeout(t);
    };
  }, []);

  return null;
}

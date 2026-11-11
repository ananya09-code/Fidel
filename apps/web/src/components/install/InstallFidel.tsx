import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Download } from "lucide-react";
import "./install.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallContextValue = {
  prompt: InstallPromptEvent | null;
  installed: boolean;
  requestInstall: () => Promise<void>;
};

const InstallContext = createContext<InstallContextValue>({
  prompt: null,
  installed: false,
  requestInstall: async () => {},
});

export function useFidelInstalled() {
  return useContext(InstallContext).installed;
}

export function InstallFidelProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    }
    function onInstalled() {
      setPrompt(null);
      setInstalled(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function requestInstall() {
    if (!prompt) return;
    setPrompt(null); // A browser install prompt can only be used once.
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      // Keep manual installation instructions available if the browser declines.
    }
  }

  return <InstallContext.Provider value={{ prompt, installed, requestInstall }}>{children}</InstallContext.Provider>;
}

function manualInstructions() {
  if (typeof navigator === "undefined") return "Use your browser’s menu to add Fidel to your device.";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "In Safari, tap Share, then Add to Home Screen.";
  if (/Android/.test(navigator.userAgent)) return "Open your browser menu, then choose Install app or Add to Home screen.";
  return "Use the install icon in your browser’s address bar, or choose Install Fidel from its menu.";
}

export function InstallFidel({ className = "", buttonClassName = "app-secondary" }: { className?: string; buttonClassName?: string }) {
  const { prompt, installed, requestInstall } = useContext(InstallContext);
  const [showHelp, setShowHelp] = useState(false);

  if (installed) return null;

  return <div className={`install-fidel ${className}`}>
    <button type="button" className={buttonClassName} onClick={() => {
      if (prompt) void requestInstall();
      else setShowHelp((current) => !current);
    }} aria-expanded={prompt ? undefined : showHelp}>
      <Download size={17} aria-hidden="true" />Install Fidel
    </button>
    {showHelp && !prompt && <p role="status" className="install-fidel-help">{manualInstructions()}</p>}
  </div>;
}

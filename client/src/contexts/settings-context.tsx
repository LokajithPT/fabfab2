import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface UserSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  gstEnabled: boolean;
  gstin: string;
  defaultInvoiceNote: string;
  currency: string;
  timezone: string;
}

const defaultSettings: UserSettings = {
  storeName: "FabZ Clean",
  storeAddress: "",
  storePhone: "",
  storeEmail: "",
  gstEnabled: false,
  gstin: "",
  defaultInvoiceNote: "Thank you for your business!",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("fab-settings");
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        // ignore
      }
    }
    setIsLoading(false);
  }, []);

  const updateSettings = useCallback((s: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...s };
      localStorage.setItem("fab-settings", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

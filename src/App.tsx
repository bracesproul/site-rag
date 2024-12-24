import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import SettingsForm from "./components/SettingsForm";
import Index from "./components/Index";
import { Button } from "./components/ui/button";
import { RuntimeProvider } from "./runtimes/assistant-ui";
import ChatView from "./components/ChatView";
import { Model } from "./types";
import ModelSelect from "./components/ModelSelect";

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [queryMode, setQueryMode] = useState<"page" | "site">("site");
  const [model, setModel] = useState<Model>("gpt-4o");
  const [retrievalMode, setRetrievalMode] = useState<"base" | "multi">("base");

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setCurrentUrl(url);
    });
  }, []);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <RuntimeProvider queryMode={queryMode} model={model} retrievalMode={retrievalMode}>
      <div className="w-[700px] h-[600px] rounded-3xl p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xl font-semibold text-black tracking-tighter">
            Site<span className="font-extrabold text-red-600">RAG</span>
          </p>
          <div className="flex items-center gap-2">
            <ModelSelect model={model} setModel={setModel} />
            <Button variant="ghost" onClick={toggleSettings}>
              <Settings size={24} />
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <Index currentUrl={currentUrl} />
        </div>

        {showSettings ? (
          <SettingsForm onClose={() => setShowSettings(false)} />
        ) : (
          <ChatView queryMode={queryMode} setQueryMode={setQueryMode} retrievalMode={retrievalMode} setRetrievalMode={setRetrievalMode} />
        )}
      </div>
    </RuntimeProvider>
  );
};

export default App;

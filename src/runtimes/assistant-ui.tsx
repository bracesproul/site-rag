import { useEffect, useState, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { queryModel } from "@/graphs/query";
import { Model } from "@/types";

const ModelAdapter = (args: Record<string, any>): ChatModelAdapter => {
  return {
    async *run({ messages, abortSignal }) {
      const stream = await queryModel({
        messages,
        abortSignal,
        currentUrl: args.currentUrl,
        queryMode: args.queryMode,
        model: args.model,
      });

      let text = "";
      for await (const part of stream) {
        text += part.content;

        yield {
          content: [{ type: "text", text }],
        };
      }
    },
  };
};

export function RuntimeProvider({
  children,
  queryMode,
  model,
  retrievalMode,
}: Readonly<{
  children: ReactNode;
  queryMode: "page" | "site";
  model: Model;
  retrievalMode: "base" | "multi";
}>) {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setCurrentUrl(url);
    });
  }, []);

  const runtime = useLocalRuntime(
    ModelAdapter({ currentUrl, queryMode, model, retrievalMode }),
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

import { type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { queryModel } from "@/graphs/query/index";
import { ALL_MODEL_NAMES } from "@/constants";

const ModelAdapter = (args: Record<string, any>): ChatModelAdapter => {
  return {
    async *run({ messages, abortSignal }) {
      const messagesCopy = [...messages];
      const stream = await queryModel({
        messages: messagesCopy,
        abortSignal,
        currentUrl: args.currentUrl,
        queryMode: args.queryMode,
        model: args.model,
        retrievalMode: args.retrievalMode,
        contextStuff: args.contextStuff,
        sessionId: args.sessionId,
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
  currentUrl,
  queryMode,
  model,
  retrievalMode,
  contextStuff,
  sessionId,
}: Readonly<{
  children: ReactNode;
  currentUrl: string;
  queryMode: "page" | "site";
  model: ALL_MODEL_NAMES;
  retrievalMode: "base" | "multi";
  contextStuff: boolean;
  sessionId: string;
}>) {
  const runtime = useLocalRuntime(
    ModelAdapter({
      currentUrl,
      queryMode,
      model,
      retrievalMode,
      contextStuff,
      sessionId,
    }),
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

import React from "react";
import { Thread } from "./assistant-ui/thread";

export default function ChatView({
  queryMode,
  setQueryMode,
  retrievalMode,
  setRetrievalMode,
}: {
  queryMode: "page" | "site";
  setQueryMode: React.Dispatch<React.SetStateAction<"page" | "site">>;
  retrievalMode: "base" | "multi";
  setRetrievalMode: React.Dispatch<React.SetStateAction<"base" | "multi">>;
}) {
  return (
    <div className="w-full mt-auto h-full max-h-[465px] overflow-y-auto">
      <Thread
        queryMode={queryMode}
        setQueryMode={setQueryMode}
        retrievalMode={retrievalMode}
        setRetrievalMode={setRetrievalMode}
      />
    </div>
  );
}

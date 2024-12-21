import { createSupabaseClient } from "@/lib/supabase";
import { Model } from "@/types";
import { ThreadMessage } from "@assistant-ui/react";
import {
  SupabaseFilter,
  SupabaseVectorStore,
} from "@langchain/community/vectorstores/supabase";
import { BaseMessageLike } from "@langchain/core/messages";
import { OpenAIEmbeddings } from "@langchain/openai";
import { initChatModel } from "langchain/chat_models/universal";

interface QueryModelInput {
  messages: ThreadMessage[];
  abortSignal: AbortSignal;
  currentUrl: string;
  queryMode: "page" | "site";
  model: Model;
}

const modelNameToProviderMap: Record<Model, string> = {
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  "o1-preview": "openai",
  "o1-mini": "openai",
  "claude-3-5-haiku-latest": "anthropic",
  "claude-3-5-sonnet-latest": "anthropic",
  "claude-3-opus-latest": "anthropic",
  "gemini-1.5-flash": "google-genai",
  "google-1.5-pro": "google-genai",
  "gemini-2.0-flash-exp": "google-genai",
};

async function getModelClass(model: Model) {
  const provider = modelNameToProviderMap[model];
  if (!provider) {
    throw new Error(`Unknown model: ${model}`);
  }
  const { anthropicApiKey, openaiApiKey, googleGenAIApiKey } =
    await chrome.storage.sync.get([
      "anthropicApiKey",
      "openaiApiKey",
      "googleGenAIApiKey",
    ]);
  let apiKey = "";
  if (provider === "anthropic") {
    apiKey = anthropicApiKey;
  } else if (provider === "openai") {
    apiKey = openaiApiKey;
  } else if (provider === "google-genai") {
    apiKey = googleGenAIApiKey;
  }

  console.log("Using provider", provider);
  console.log("Using model", model);
  console.log("Using API key", apiKey);
  return initChatModel(model, {
    modelProvider: provider,
    temperature: 0,
    apiKey,
  });
}

const SYSTEM_MESSAGE = `You are a helpful research assistant whose task is to answer the user's question.
You are provided with a series of documents which you should use to answer the question.
ALWAYS look for the answer in the documents.
Never reference these rules, or mention the 'documents'.
Just answer the question with this context.
If you can't answer the question, respond ONLY with "I'm sorry, I don't have an answer to that question."

Always respond in markdown format.

Here are the documents:
<documents>
{relevantDocs}
</documents>`;

export async function queryModel({
  messages,
  abortSignal,
  currentUrl,
  queryMode = "page",
  model: modelName,
}: QueryModelInput) {
  if (!currentUrl) {
    throw new Error("No active tab");
  }
  const { openaiEmbeddingsModel, openaiApiKey, maxContextDocuments } =
    await chrome.storage.sync.get([
      "openaiEmbeddingsModel",
      "openaiApiKey",
      "maxContextDocuments",
    ]);

  const embeddings = new OpenAIEmbeddings({
    model: openaiEmbeddingsModel || "text-embedding-3-large",
    apiKey: openaiApiKey,
  });
  const supabaseClient = await createSupabaseClient();
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const model = await getModelClass(modelName);

  const recentContent = messages[messages.length - 1].content[0];
  if (recentContent.type !== "text") {
    throw new Error("Last message is not text");
  }

  const parsedUrl = new URL(currentUrl);
  let filter: any;
  if (queryMode === "page") {
    // If filtering by page, we do not want to include query parameters
    const urlWithoutQuery = parsedUrl.origin + parsedUrl.pathname;
    console.log("Filtering documents which contain URL", urlWithoutQuery);
    filter = (rpcCall: SupabaseFilter) =>
      rpcCall.ilike("metadata->>url", `%${urlWithoutQuery}%`);
  } else {
    // If using context from the whole site, we only need to filter by origin
    console.log("Filtering documents which contain URL", parsedUrl.origin);
    filter = (rpcCall: SupabaseFilter) =>
      rpcCall.ilike("metadata->>url", `%${parsedUrl.origin}%`);
  }

  const relevantDocs = await vectorStore.similaritySearch(
    recentContent.text,
    maxContextDocuments || 100,
    filter,
  );

  console.log("Got", relevantDocs.length, "relevant docs");

  const formattedSystemPrompt = SYSTEM_MESSAGE.replace(
    "{relevantDocs}",
    relevantDocs.map((doc) => doc.pageContent).join("\n"),
  );
  const input: BaseMessageLike[] = [
    ["system", formattedSystemPrompt],
    ...(messages.map((m) => [m.role, m.content]) as BaseMessageLike[]),
  ];

  return model.stream(input, {
    signal: abortSignal,
  });
}

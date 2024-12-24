import { createSupabaseClient } from "@/lib/supabase";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

interface IndexDataInput {
  url: string;
  mode: "scrape" | "crawl";
}

export async function indexData({ url, mode }: IndexDataInput): Promise<any> {
  const { fireCrawlApiKey, openaiApiKey, maxChunkSize, maxChunkOverlap } =
    await chrome.storage.sync.get([
      "fireCrawlApiKey",
      "openaiApiKey",
      "maxChunkSize",
      "maxChunkOverlap",
    ]);

  if (!fireCrawlApiKey) {
    throw new Error("No API key found for FireCrawl");
  }
  if (!openaiApiKey) {
    throw new Error("No API key found for OpenAI");
  }

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
    apiKey: openaiApiKey,
  });

  const supabaseClient = await createSupabaseClient();

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const client = new FireCrawlLoader({
    url,
    apiKey: fireCrawlApiKey,
    mode,
    params: {
      ...(mode === "crawl" ? { allowBackwardLinks: true } : {}),
    },
  });

  let docs = await client.load();
  docs = docs.map((d) => ({
    ...d,
    metadata: {
      ...d.metadata,
      _indexed_at: new Date().toISOString(),
    },
  }));

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: maxChunkSize,
    chunkOverlap: maxChunkOverlap,
  });

  const chunkedDocs = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(chunkedDocs);

  return {
    docs: chunkedDocs,
  };
}

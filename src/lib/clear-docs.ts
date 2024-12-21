import { createSupabaseClient } from "@/lib/supabase";

async function clearDocs({ currentUrl }: { currentUrl: string }) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("documents")
    .delete()
    .filter("metadata->>url", "ilike", `%${currentUrl}%`);

  if (error) {
    throw error;
  }

  console.log(`Successfully deleted documents containing URL: ${currentUrl}`);
}

export default clearDocs;

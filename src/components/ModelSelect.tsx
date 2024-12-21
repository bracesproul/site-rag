import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
  GOOGLE_GENAI_MODELS,
} from "@/constants";
import { Model } from "@/types";

export default function ModelSelect({
  model,
  setModel,
}: {
  model: Model;
  setModel: React.Dispatch<React.SetStateAction<Model>>;
}) {
  return (
    <Select value={model} onValueChange={(v) => setModel(v as Model)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Anthropic</SelectLabel>
          {ANTHROPIC_MODELS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>OpenAI</SelectLabel>
          {OPENAI_MODELS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Google GenAI</SelectLabel>
          {GOOGLE_GENAI_MODELS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

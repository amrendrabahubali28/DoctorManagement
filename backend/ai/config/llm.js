import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// LLM: Generates the chatbot's answers
export const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0.2,
  maxTokens: 700,
  apiKey: process.env.OPENAI_API_KEY,
});

// Embedding model: Converts text into vectors
export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY,
});

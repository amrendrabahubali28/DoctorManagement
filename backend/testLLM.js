
import "dotenv/config";
import { llm, embeddings } from "./ai/config/llm.js";

async function testAI() {
  try {
    const response = await llm.invoke(
      "Explain what RAG means in one sentence."
    );

    console.log("LLM Response:", response.content);

    const vector = await embeddings.embedQuery(
      "What are the symptoms of fever?"
    );

    console.log("Embedding dimensions:", vector.length);
    console.log("AI configuration working!");
  } catch (error) {
    console.error("AI Test Error:", error.message);
  }
}

testAI();

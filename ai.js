import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

let engine = null;
let loading = false;

export async function startAI(onProgress) {
  if (engine) return engine;
  if (loading) return null;

  loading = true;

  try {
    engine = await CreateMLCEngine(MODEL, {
      initProgressCallback: (progress) => {
        if (onProgress) {
          onProgress(progress.text || "Preparando a IA...");
        }
      }
    });

    return engine;
  } catch (error) {
    console.error(error);
    throw new Error(
      "Não foi possível iniciar a IA. Verifique se seu navegador suporta WebGPU."
    );
  } finally {
    loading = false;
  }
}

export async function askAI(question) {
  if (!engine) {
    await startAI();
  }

  const response = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Você é a IA Escolar. Ajude alunos com Matemática, Português, História, Geografia, Ciências e outras matérias. Explique de maneira simples, correta e educativa."
      },
      {
        role: "user",
        content: question
      }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return response.choices[0].message.content;
}

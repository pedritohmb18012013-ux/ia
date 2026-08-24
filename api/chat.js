export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { message, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({
        error: "Envie uma mensagem ou uma imagem."
      });
    }

    const content = [];

    content.push({
      type: "text",
      text:
        message ||
        "Analise esta imagem e explique o conteúdo em português do Brasil."
    });

    if (image) {
      if (
        typeof image !== "string" ||
        !image.startsWith("data:image/")
      ) {
        return res.status(400).json({
          error: "Imagem inválida."
        });
      }

      if (image.length > 15 * 1024 * 1024) {
        return res.status(400).json({
          error:
            "A imagem é muito grande. Escolha uma foto menor."
        });
      }

      content.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },

        body: JSON.stringify({
          model: "qwen/qwen3.6-27b",

          messages: [
            {
              role: "system",
              content:
                "Você é a IA Escolar. RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. Nunca responda em inglês, espanhol ou outro idioma, exceto se o usuário pedir explicitamente para usar outro idioma. Ajude alunos com Matemática, Português, História, Geografia, Ciências e outras matérias. Explique de maneira simples, clara, correta e educativa. Quando receber uma foto de uma questão, leia o conteúdo da imagem e explique a resolução passo a passo. Se alguma parte da imagem estiver ilegível, informe isso ao usuário em português. Não invente informações que não estejam presentes ou legíveis na imagem."
            },
            {
              role: "user",
              content
            }
          ],

          temperature: 0.7,
          max_completion_tokens: 800
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Groq:", data);

      return res.status(response.status).json({
        error: "Erro ao consultar a IA."
      });
    }

    const answer =
      data.choices?.[0]?.message?.content;

    return res.status(200).json({
      answer:
        answer ||
        "Não consegui analisar o conteúdo."
    });

  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
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

    // Resposta fixa para a pergunta sobre o criador
    if (
      message &&
      /quem (criou|fez|desenvolveu) você|quem é seu criador|quem te criou/i.test(message)
    ) {
      return res.status(200).json({
        answer:
          "Eu fui criada e desenvolvida para este projeto por Pedro Henrique Machado Bittencourt. 🤖"
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
              content: `
REGRA ABSOLUTA DE IDIOMA:

Você DEVE responder SEMPRE EXCLUSIVAMENTE em PORTUGUÊS DO BRASIL.

NÃO escreva em inglês.
NÃO misture inglês com português.
NÃO escreva em espanhol.
NÃO misture idiomas.

Somente use outro idioma se o usuário pedir explicitamente para traduzir ou responder nesse idioma.

Você é um assistente de inteligência artificial geral.

Pode ajudar com:
- estudos
- matemática
- português
- história
- geografia
- ciências
- programação
- tecnologia
- escrita
- criatividade
- informações gerais
- explicações
- resolução de problemas
- análise de imagens

Se receber uma imagem, analise cuidadosamente o conteúdo e explique o que conseguir identificar.

Se alguma parte da imagem estiver ilegível, informe isso claramente em português.

Não invente informações.

Se perguntarem quem criou ou desenvolveu esta IA ou este projeto, responda exatamente:

"Eu fui criada e desenvolvida para este projeto por Pedro Henrique Machado Bittencourt. 🤖"

Nunca diga que Pedro Henrique Machado Bittencourt criou o modelo de IA utilizado pelo serviço.
              `
            },
            {
              role: "user",
              content
            }
          ],

          temperature: 0.5,
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
        "Não consegui gerar uma resposta."
    });

  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
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

    // Resposta fixa para o criador do projeto
    if (
      message &&
      /quem (criou|fez|desenvolveu) você|quem é seu criador|quem te criou/i.test(
        message
      )
    ) {
      return res.status(200).json({
        answer:
          "Eu fui criada e desenvolvida para este projeto por Pedro Henrique Machado Bittencourt. 🤖"
      });
    }

    const content = [
      {
        type: "text",
        text:
          message ||
          "Analise esta imagem e explique o conteúdo em português do Brasil."
      }
    ];

    // Verificação da imagem
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

    // =====================================================
    // PRIMEIRA IA
    // =====================================================

    const firstResponse = await fetch(
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
Você é uma inteligência artificial geral.

RESPONDA EM PORTUGUÊS DO BRASIL.

A resposta deve ser naturalmente escrita em português brasileiro.

Você pode responder sobre qualquer assunto permitido:
matemática, ciência, tecnologia, programação, história,
geografia, estudos, escrita, criatividade, curiosidades,
problemas do dia a dia e análise de imagens.

Quando receber uma imagem, analise cuidadosamente o conteúdo.

Se alguma informação estiver ilegível, diga isso.

Não invente informações.

IMPORTANTE:
Não misture idiomas na resposta.
Não comece a resposta em português e continue em inglês.
Não escreva frases em inglês ou espanhol.

Somente utilize outro idioma quando o usuário pedir explicitamente
uma tradução ou pedir que a resposta seja naquele idioma.
`
            },

            {
              role: "user",
              content
            }
          ],

          temperature: 0.2,
          max_completion_tokens: 800
        })
      }
    );

    const firstData = await firstResponse.json();

    if (!firstResponse.ok) {
      console.error("Erro primeira IA:", firstData);

      return res.status(firstResponse.status).json({
        error: "Erro ao consultar a IA."
      });
    }

    let answer =
      firstData.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(200).json({
        answer: "Não consegui gerar uma resposta."
      });
    }

    // =====================================================
    // SEGUNDA IA — REVISOR DE IDIOMA
    // =====================================================

    const reviewResponse = await fetch(
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
Você é um REVISOR DE IDIOMA.

Sua tarefa é simples:

REESCREVA a resposta recebida em PORTUGUÊS DO BRASIL.

REGRAS:

- Retorne somente a resposta final.
- Não explique o que você alterou.
- Não diga que é um revisor.
- Preserve o significado.
- Não adicione informações.
- Não remova informações importantes.
- Não use inglês.
- Não use espanhol.
- Não misture idiomas.

Exceções permitidas:
nomes próprios, nomes de empresas,
nomes de produtos, linguagens de programação,
comandos, códigos e termos técnicos que precisam permanecer
no idioma original.

Se a resposta já estiver em português,
apenas mantenha-a em português.

RETORNE SOMENTE A RESPOSTA.
`
            },

            {
              role: "user",
              content: answer
            }
          ],

          temperature: 0,
          max_completion_tokens: 900
        })
      }
    );

    const reviewData = await reviewResponse.json();

    if (reviewResponse.ok) {
      const reviewedAnswer =
        reviewData.choices?.[0]?.message?.content?.trim();

      if (reviewedAnswer) {
        answer = reviewedAnswer;
      }
    }

    // =====================================================
    // TERCEIRA VERIFICAÇÃO
    // =====================================================

    const finalResponse = await fetch(
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
Você é o último filtro de idioma.

Receba uma resposta e devolva uma versão final
em PORTUGUÊS DO BRASIL.

Não converse.
Não explique.
Não faça comentários.

Apenas devolva a resposta corrigida.

Não traduza nomes próprios, códigos,
nomes de empresas ou termos técnicos necessários.

Não misture idiomas.
`
            },

            {
              role: "user",
              content: answer
            }
          ],

          temperature: 0,
          max_completion_tokens: 900
        })
      }
    );

    const finalData = await finalResponse.json();

    if (finalResponse.ok) {
      const finalAnswer =
        finalData.choices?.[0]?.message?.content?.trim();

      if (finalAnswer) {
        answer = finalAnswer;
      }
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
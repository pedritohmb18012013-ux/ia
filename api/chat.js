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

    // Resposta fixa para perguntas sobre o criador do projeto
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

    const systemPrompt = `
Você é um assistente de inteligência artificial geral.

REGRA PRINCIPAL:
Responda SEMPRE em português do Brasil.

Não misture português com inglês, espanhol ou outros idiomas.

Somente use outro idioma quando o próprio usuário pedir explicitamente uma tradução ou pedir uma resposta naquele idioma.

Você pode ajudar com:
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
- dúvidas gerais
- explicações
- resolução de problemas
- análise de imagens

Quando receber uma imagem, analise cuidadosamente o conteúdo.

Se alguma parte da imagem estiver ilegível, diga isso claramente.

Não invente informações.

Se perguntarem quem criou, fez ou desenvolveu esta IA ou este projeto, responda:

"Eu fui criada e desenvolvida para este projeto por Pedro Henrique Machado Bittencourt. 🤖"

Não diga que Pedro Henrique Machado Bittencourt criou o modelo de IA utilizado pelo serviço.
`;

    // PRIMEIRA RESPOSTA
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
              content: systemPrompt
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

    let answer =
      data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(200).json({
        answer: "Não consegui gerar uma resposta."
      });
    }

    /*
     * SEGUNDA VERIFICAÇÃO
     *
     * Pedimos para outro processamento revisar
     * a resposta e devolver somente português.
     */
    const verificationResponse = await fetch(
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
Você é o revisor final de respostas de uma IA.

Sua ÚNICA função é verificar a resposta recebida.

REGRAS ABSOLUTAS:

1. A resposta final deve estar SOMENTE em português do Brasil.
2. Não deixe palavras ou frases em inglês.
3. Não deixe palavras ou frases em espanhol.
4. Não misture idiomas.
5. Preserve o significado original.
6. Não acrescente informações novas.
7. Não explique que você fez uma revisão.
8. Retorne somente a resposta final corrigida.

EXCEÇÃO:
Se a resposta contiver nomes próprios, nomes de empresas, nomes de produtos, comandos de programação, códigos, termos técnicos ou palavras que precisam permanecer em outro idioma para manter o significado, eles podem permanecer.
`
            },
            {
              role: "user",
              content: answer
            }
          ],

          temperature: 0.1,
          max_completion_tokens: 900
        })
      }
    );

    const verificationData =
      await verificationResponse.json();

    if (verificationResponse.ok) {
      const verifiedAnswer =
        verificationData.choices?.[0]?.message?.content?.trim();

      if (verifiedAnswer) {
        answer = verifiedAnswer;
      }
    } else {
      console.error(
        "Erro na segunda verificação:",
        verificationData
      );
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
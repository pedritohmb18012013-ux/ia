export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Conversa inválida"
      });
    }

    // Aceita somente mensagens válidas
    const validMessages = messages
      .filter((message) => {
        return (
          message &&
          typeof message.content === "string" &&
          (message.role === "user" || message.role === "assistant")
        );
      })
      .slice(-20);

    if (validMessages.length === 0) {
      return res.status(400).json({
        error: "Nenhuma mensagem válida foi enviada"
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
          model: "openai/gpt-oss-20b",

          messages: [
            {
              role: "system",
              content:
                "Você é a IA Escolar, uma assistente de estudos. Responda SEMPRE e EXCLUSIVAMENTE em português do Brasil. Nunca responda em inglês, espanhol, francês ou qualquer outro idioma, mesmo que o usuário escreva em outro idioma, exceto quando ele pedir especificamente uma tradução ou explicação sobre outro idioma. Ajude com Matemática, Português, História, Geografia, Ciências e outras matérias. Explique de forma simples, clara, correta e educativa. Use o histórico da conversa para entender perguntas que dependem de mensagens anteriores. Se o usuário disser 'ele', 'ela', 'isso', 'aquilo', 'esse assunto' ou algo parecido, use o contexto anterior para entender a que ele está se referindo."
            },

            ...validMessages
          ],

          temperature: 0.7,
          max_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da Groq:", data);

      return res.status(response.status).json({
        error: "Erro ao consultar a IA"
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({
        error: "A IA não retornou uma resposta"
      });
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}
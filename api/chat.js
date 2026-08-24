
export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({
error: "Método não permitido"
});
}

try {
const { message } = req.body;

if (!message || typeof message !== "string") {  
  return res.status(400).json({  
    error: "Mensagem inválida"  
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
            "Você é a IA Escolar. Ajude alunos com Matemática, Português, História, Geografia, Ciências e outras matérias. Explique de forma simples, correta e educativa."  
        },  
        {  
          role: "user",  
          content: message  
        }  
      ],  
      temperature: 0.7,  
      max_tokens: 500  
    })  
  }  
);  

const data = await response.json();  

if (!response.ok) {  
  console.error(data);  

  return res.status(response.status).json({  
    error: "Erro ao consultar a IA"  
  });  
}  

const answer = data.choices?.[0]?.message?.content;  

return res.status(200).json({  
  answer: answer || "Não consegui gerar uma resposta."  
});

} catch (error) {
console.error(error);

return res.status(500).json({  
  error: "Erro interno do servidor"  
});

}
}
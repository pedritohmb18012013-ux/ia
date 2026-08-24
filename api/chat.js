const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const status = document.getElementById("status");

let sending = false;

// Memória da conversa
let conversation = [];

try {
  const saved = localStorage.getItem("ia_escolar_conversation");

  if (saved) {
    conversation = JSON.parse(saved);
  }
} catch (error) {
  console.error("Erro ao carregar memória:", error);
  conversation = [];
}

// Mostra uma mensagem na tela
function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `message ${type}`;
  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;

  return message;
}

// Salva a conversa no navegador
function saveConversation() {
  try {
    localStorage.setItem(
      "ia_escolar_conversation",
      JSON.stringify(conversation)
    );
  } catch (error) {
    console.error("Erro ao salvar memória:", error);
  }
}

// Carrega a conversa salva na tela
function loadConversation() {
  if (!Array.isArray(conversation)) {
    conversation = [];
    return;
  }

  conversation.forEach((message) => {
    if (message.role === "user") {
      addMessage(message.content, "user");
    }

    if (message.role === "assistant") {
      addMessage(message.content, "ai");
    }
  });
}

// Envia a pergunta
async function sendMessage() {
  const text = input.value.trim();

  if (!text || sending) {
    return;
  }

  sending = true;
  button.disabled = true;

  // Mostra pergunta do usuário
  addMessage(text, "user");

  // Adiciona pergunta à memória
  conversation.push({
    role: "user",
    content: text
  });

  // Mantém somente as últimas 20 mensagens
  conversation = conversation.slice(-20);

  saveConversation();

  input.value = "";

  // Mensagem de carregamento
  const loading = addMessage("🤔 Pensando...", "ai");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao consultar a IA");
    }

    const answer =
      typeof data.answer === "string"
        ? data.answer
        : "Não consegui gerar uma resposta.";

    // Mostra resposta
    loading.textContent = answer;

    // Adiciona resposta à memória
    conversation.push({
      role: "assistant",
      content: answer
    });

    // Mantém somente as últimas 20 mensagens
    conversation = conversation.slice(-20);

    saveConversation();

  } catch (error) {
    console.error("Erro:", error);

    loading.textContent =
      "⚠️ Não consegui responder agora. Tente novamente.";

    // Remove a última pergunta da memória caso tenha ocorrido erro
    if (
      conversation.length > 0 &&
      conversation[conversation.length - 1].role === "user"
    ) {
      conversation.pop();
      saveConversation();
    }
  }

  sending = false;
  button.disabled = false;
  input.focus();
}

// Botão Enviar
button.addEventListener("click", sendMessage);

// Tecla Enter
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Status
if (status) {
  status.textContent = "IA pronta para ajudar";
}

// Recupera conversa anterior
loadConversation();
const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `message ${type}`;
  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function respond(question) {
  const q = question.toLowerCase();

  if (q.includes("oi") || q.includes("olá")) {
    return "Olá! 👋 Como posso ajudar você nos estudos?";
  }

  if (q.includes("quanto é") || q.includes("calcule")) {
    return "Posso ajudar com cálculos. Em breve teremos uma IA completa para resolver suas questões.";
  }

  if (q.includes("matemática")) {
    return "Claro! 📐 Posso ajudar com Matemática, incluindo contas, equações, porcentagem e outros assuntos.";
  }

  if (q.includes("história")) {
    return "Claro! 📚 Posso ajudar a estudar História e explicar os assuntos de forma simples.";
  }

  if (q.includes("ciências")) {
    return "Claro! 🔬 Posso ajudar com Ciências e explicar os conteúdos passo a passo.";
  }

  return "Entendi! 🤖 Ainda estou sendo configurada. Em breve vou conseguir responder perguntas de várias matérias.";
}

function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");

  input.value = "";

  setTimeout(() => {
    const answer = respond(text);
    addMessage(answer, "ai");
  }, 500);
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

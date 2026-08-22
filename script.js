const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const status = document.getElementById("status");

let sending = false;

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `message ${type}`;
  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;

  return message;
}

async function sendMessage() {
  const text = input.value.trim();

  if (!text || sending) return;

  sending = true;
  button.disabled = true;

  addMessage(text, "user");

  input.value = "";

  const loading = addMessage("🤔 Pensando...", "ai");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao consultar a IA");
    }

    loading.textContent = data.answer;
  } catch (error) {
    console.error(error);

    loading.textContent =
      "⚠️ Não consegui responder agora. Tente novamente.";
  }

  sending = false;
  button.disabled = false;
  input.focus();
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

if (status) {
  status.textContent = "IA pronta para ajudar";
}

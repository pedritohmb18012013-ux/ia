const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const status = document.getElementById("status");
const imageInput = document.getElementById("imageInput");
const imageButton = document.getElementById("imageButton");

let sending = false;
let selectedImage = null;

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `message ${type}`;
  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;

  return message;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

imageButton.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Escolha uma imagem.");
    imageInput.value = "";
    return;
  }

  // Limita a foto original a 8 MB
  if (file.size > 8 * 1024 * 1024) {
    alert("A foto é muito grande. Escolha uma imagem com menos de 8 MB.");
    imageInput.value = "";
    return;
  }

  try {
    selectedImage = await fileToBase64(file);

    addMessage("📷 Foto selecionada. Agora faça sua pergunta.", "user");

  } catch (error) {
    console.error(error);
    alert("Não foi possível carregar a foto.");
  }
});

async function sendMessage() {
  const text = input.value.trim();

  if ((!text && !selectedImage) || sending) return;

  sending = true;
  button.disabled = true;
  imageButton.disabled = true;

  if (text) {
    addMessage(text, "user");
  }

  input.value = "";

  const imageToSend = selectedImage;

  selectedImage = null;
  imageInput.value = "";

  const loading = addMessage("🤔 Analisando...", "ai");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: text,
        image: imageToSend
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
      "⚠️ Não consegui analisar agora. Tente novamente.";
  }

  sending = false;
  button.disabled = false;
  imageButton.disabled = false;

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
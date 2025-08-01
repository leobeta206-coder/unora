const apiKey = process.env.OPENROUTER_API_KEY;
const MODEL = "deepseek/deepseek-r1-0528:free";  // Modelo gratuito GLM 4.5 Air

let abortController = null;

function addMessage(role, content) {
  const chatContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;
  messageDiv.innerHTML = content;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
  const chatContainer = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message typing-indicator';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) typingIndicator.remove();
}

async function sendMessage() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();
  if (message === '') return;

  if (abortController) abortController.abort();
  abortController = new AbortController();

  addMessage('user', message);
  userInput.value = '';
  showTypingIndicator();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Eres un asistente académico de Unora Academy. Siempre respondes en español. Tienes un tono amable, claro, educativo y empático. Ayudas a resolver dudas sobre el curso EXCOBA, explicando con ejemplos y con paciencia."
          },
          {
            role: "user",
            content: message
          }
        ]
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    hideTypingIndicator();

    const replyMarkdown = data?.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu pregunta.";
    const replyHTML = marked.parse(replyMarkdown);
    addMessage('bot', replyHTML);

  } catch (error) {
    hideTypingIndicator();
    if (error.name === 'AbortError') {
      console.log("Petición anterior abortada");
      return;
    }

    addMessage('bot', `Error: No se pudo conectar con el servidor. ${error.message}`);
    console.error("Error:", error);
  } finally {
    abortController = null;
  }
}

document.getElementById('user-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});

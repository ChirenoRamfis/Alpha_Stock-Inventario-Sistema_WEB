const API_URL = "http://localhost:3000";

const usernameInput = document.getElementById("username");
const securityQuestionLabel = document.getElementById("securityQuestionLabel");

// Mostrar la pregunta de seguridad al perder foco
usernameInput.addEventListener("blur", async function () {
  const username = this.value.trim();
  if (!username) return;

  try {
    const res = await fetch(`${API_URL}/get-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (res.ok && data.question) {
      securityQuestionLabel.textContent = data.question;
      securityQuestionLabel.style.color = "#667eea";
    } else {
      securityQuestionLabel.textContent = data.error || "Usuario no encontrado";
      securityQuestionLabel.style.color = "#c33";
    }
  } catch {
    securityQuestionLabel.textContent = "Error al conectar con el servidor";
    securityQuestionLabel.style.color = "#c33";
  }
});

// Procesar formulario
document
  .getElementById("recoveryForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const securityAnswer = document
      .getElementById("securityAnswer")
      .value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      showMessage("Las contraseñas no coinciden.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, securityAnswer, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        document.getElementById("recoveryForm").classList.add("hide");
        document.getElementById("successMessage").classList.add("show");
      } else {
        showMessage(data.error || "Error al actualizar contraseña", "error");
      }
    } catch {
      showMessage("Error al conectar con el servidor.", "error");
    }
  });

function showMessage(message, type) {
  const messageContainer = document.getElementById("messageContainer");
  messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => (messageContainer.innerHTML = ""), 5000);
}

function goToLogin() {
  window.location.href = "login.html";
}

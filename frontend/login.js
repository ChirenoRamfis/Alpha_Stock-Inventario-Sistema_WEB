const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  successMessage.style.display = "none";
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = "block";
  errorMessage.style.display = "none";
}

function hideMessages() {
  errorMessage.style.display = "none";
  successMessage.style.display = "none";
}

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  hideMessages();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError("Por favor ingrese usuario y contraseña.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Verificando...";

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess(data.message);
      setTimeout(() => {
        localStorage.setItem("logueado", "true");
        window.location.href = "index.html";
      }, 1500);
    } else {
      showError(data.error || "Error al iniciar sesión.");
    }
  } catch (err) {
    console.log(err), showError("No se pudo conectar con el servidor.");
  }

  loginBtn.disabled = false;
  loginBtn.textContent = "Iniciar Sesión";
});

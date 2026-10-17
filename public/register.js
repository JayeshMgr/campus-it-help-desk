const registerForm = document.getElementById("registerForm");
const errorMessage = document.getElementById("errorMessage");
const registerButton = document.getElementById("registerButton");

// Handle student registration
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  errorMessage.textContent = "";
  registerButton.disabled = true;

  try {
    // Send registration details to the backend
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.textContent = data.message || "Registration failed";
      return;
    }

    // Redirect to login after successful registration
    window.location.href = "login.html";
  } catch (error) {
    errorMessage.textContent = "Unable to connect to the server";
  } finally {
    registerButton.disabled = false;
  }
});

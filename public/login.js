const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const loginButton = document.getElementById("loginButton");

// Dashboard page for each role returned by the backend
const dashboards = {
  student: "student.html",
  staff: "admin.html",
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    errorMessage.textContent = "Email and password are required";
    return;
  }

  loginButton.disabled = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.textContent = data.message || "Login failed";
      return;
    }

    const dashboard = dashboards[data.user.role];
    if (!dashboard) {
      errorMessage.textContent = "Unknown user role";
      return;
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("role", data.user.role);

    window.location.href = dashboard;
  } catch (error) {
    errorMessage.textContent = "Unable to reach the server. Please try again.";
  } finally {
    loginButton.disabled = false;
  }
});

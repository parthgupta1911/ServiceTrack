let selectedRole = "client"; // Default role

const otpBtn = document.getElementById("otp-btn");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const roleButtons = document.querySelectorAll(".role-selection button");

// function selectRole(role) {
//   selectedRole = role;
//   roleButtons.forEach((button) => {
//     if (button.innerText.toLowerCase() === role) {
//       button.classList.add("active");
//       document.getElementById("text").innerText = `Login as ${role}`;
//     } else {
//       button.classList.remove("active");
//     }
//   });
// }
// selectRole("client");
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch("http://localhost:5000/api/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, role: selectedRole }),
  });

  const data = await response.json();
  if (response.ok) {
    document.cookie = `token=${data.token}; path=/`;
    document.cookie = `role=${data.role}; path=/`;
    alert("Login successful redirecting to home page");
    window.location.href = "home.html";
  } else {
    alert(data.message || "Login failed");
  }
});

signupBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const response = await fetch("http://localhost:5000/api/user/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password, role: selectedRole }),
  });

  const data = await response.json();
  if (response.ok) {
    document.cookie = `jwt=${data.token}; path=/`;
    document.cookie = `role=${data.role}; path=/`;
    alert("Signup successful");
    window.location.href = "home.html";
  } else {
    alert(data.message || "Signup failed");
  }
});

document.getElementById("otp-btn").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("forgot-password-email").value;

  try {
    const response = await fetch(
      "http://localhost:5000/api/user/forgotPassword",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      alert("OTP sent successfully");
      document.getElementById("otp").classList.remove("hidden");
      document.getElementById("reset-password-btn").classList.remove("hidden");
      document.getElementById("new-password").classList.remove("hidden");
      document.getElementById("otp-btn").classList.add("hidden");
    } else {
      alert(data.message || "Failed to send OTP");
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
});

document
  .getElementById("reset-password-btn")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgot-password-email").value;
    const otp = document.getElementById("otp").value;
    const newPassword = document.getElementById("new-password").value;

    try {
      const response = await fetch(
        "http://localhost:5000/api/user/changePassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp, password: newPassword }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Password reset successfully");
        window.location.href = "login.html"; // Redirect to login page
      } else {
        alert(data.message || "Failed to reset password");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  });

function toggleForm(form) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const forgotPasswordForm = document.getElementById("forgot-password-form");

  if (form === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    forgotPasswordForm.classList.add("hidden");
    loginToggle.classList.add("active");
    signupToggle.classList.remove("active");
  } else if (form === "signup") {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    forgotPasswordForm.classList.add("hidden");
    loginToggle.classList.remove("active");
    signupToggle.classList.add("active");
  } else if (form === "forgot-password") {
    document.getElementById("otp").classList.add("hidden");
    document.getElementById("reset-password-btn").classList.add("hidden");
    document.getElementById("new-password").classList.add("hidden");
    document.getElementById("otp-btn").classList.remove("hidden");
    loginForm.classList.add("hidden");
    signupForm.classList.add("hidden");
    forgotPasswordForm.classList.remove("hidden");
    loginToggle.classList.remove("active");
    signupToggle.classList.remove("active");
  }
}

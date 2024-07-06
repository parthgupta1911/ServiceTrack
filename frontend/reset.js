document
  .getElementById("reset-password-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;

    const response = await fetch(
      "http://localhost:5000/api/user/resetPassword",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      alert("Password reset successfully");
      location.href = "login.html";
    } else {
      alert(data.message || "Failed to reset password");
    }
  });

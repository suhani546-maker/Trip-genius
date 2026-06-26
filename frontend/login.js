document.getElementById("loginbtn").addEventListener("click", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            window.location.href = "home.html";
        } else {
            alert(data.message);
        }

    } catch (err) {
        alert("Something went wrong!");
    }
});
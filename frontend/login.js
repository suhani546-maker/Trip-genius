document.getElementById("loginbtn").addEventListener("click", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("https://trip-genius.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            showToast("Login successful! Redirecting to dashboard...");

// Optional: Automatically redirect after 1.5 seconds so the user has time to read the toast
setTimeout(() => {
    window.location.href = "home.html"; // Replace with your actual dashboard file name
}, 1500);
           
        } else {
            alert(data.message);
        }

    } catch (err) {
        alert("Something went wrong!");
    }
});
// adding extra here 
function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    
    // Safety check in case the container isn't in the HTML
    if (!container) {
        console.error("Toast container not found!");
        return;
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;

    // Add it to the page
    container.appendChild(toast);

    // Trigger the slide-in animation (small delay for CSS to catch up)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Trigger the slide-out animation and remove from DOM
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Wait for the exit animation to finish before deleting the element
        setTimeout(() => {
            toast.remove();
        }, 300); // matches the 0.3s transition in CSS
    }, duration);
}

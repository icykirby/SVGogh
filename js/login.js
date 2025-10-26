const API_BASE_URL = "https://svgogh.onrender.com/api"; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageArea = document.getElementById('message-area');

    if (!loginForm) return; // Exit if the form isn't found

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        messageArea.textContent = ''; // Clear previous messages
        
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        if (!username || !password) {
            messageArea.textContent = 'Please enter both username and password.';
            messageArea.classList.add('text-red-500');
            return;
        }

        try {
            messageArea.textContent = 'Logging in...';
            messageArea.classList.remove('text-red-500', 'text-green-500');

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                
                credentials: 'include', 
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                //success signal
                messageArea.textContent = 'Login successful! Redirecting...';
                messageArea.classList.add('text-green-500');
                
                //redirect user to the main application page
                setTimeout(() => {
                    window.location.href = '/homepage.html'; 
                }, 500);

            } else {
                //fail signal
                messageArea.textContent = `Login failed: ${data.msg || 'Check server status.'}`;
                messageArea.classList.add('text-red-500');
            }

        } catch (error) {
            console.error('Login Network Error:', error);
            messageArea.textContent = 'Failed to connect to the server. Check your console.';
            messageArea.classList.add('text-red-500');
        }
    });
});

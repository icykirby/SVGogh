const API_BASE_URL = "https://svgogh.onrender.com/api";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form'); //assumes signup.html uses this ID
    const messageArea = document.getElementById('message-area');
    
    //exit if the form isn't found
    if (!signupForm) return; 

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        messageArea.textContent = '';
        
        const username = signupForm.username.value;
        const password = signupForm.password.value;

        if (!username || !password) {
            messageArea.textContent = 'Please enter both username and password.';
            messageArea.classList.add('text-red-500');
            return;
        }

        try {
            messageArea.textContent = 'Registering...';
            messageArea.classList.remove('text-red-500', 'text-green-500');

            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                //success signal
                messageArea.textContent = 'Registration successful! Redirecting to login...';
                messageArea.classList.add('text-green-500');
                
                //redirect user to the login page after successful registration
                setTimeout(() => {
                    window.location.href = '/login.html'; 
                }, 1000);

            } else {
                //fail signal
                messageArea.textContent = `Registration failed: ${data.msg || 'Check server status.'}`;
                messageArea.classList.add('text-red-500');
            }

        } catch (error) {
            console.error('Registration Network Error:', error);
            messageArea.textContent = 'Failed to connect to the server.';
            messageArea.classList.add('text-red-500');
        }
    });
});

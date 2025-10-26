const API_BASE_URL = "https://svgogh.onrender.com/api";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form'); //assume signup.html uses this ID
    const messageArea = document.getElementById('message-area');
    
    //exit if form not found
    if (!signupForm) return; 

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        messageArea.textContent = '';
        messageArea.classList.remove('text-red-500', 'text-green-500');

        const username = signupForm.username.value;
        const password = signupForm.password.value;
        
        const passwordConfirm = signupForm['password-confirm'].value;

        
        if (!username || !password || !passwordConfirm) {
            messageArea.textContent = 'Please fill in all fields.';
            messageArea.classList.add('text-red-500');
            return;
        }

        if (password !== passwordConfirm) {
            messageArea.textContent = 'Error: Passwords do not match!';
            messageArea.classList.add('text-red-500');
            return;
        }
      

        try {
            messageArea.textContent = 'Registering...';
            
            
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Only send the username and primary password
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success signal (201 Created)
                messageArea.textContent = 'Registration successful! Redirecting to login...';
                messageArea.classList.add('text-green-500');
                
                // Redirect user to the login page after successful registration
                setTimeout(() => {
                    window.location.href = '/login.html'; 
                }, 1000);

            } else {
                // Fail signal (e.g., 409 Conflict - User already exists)
                messageArea.textContent = `Registration failed: ${data.msg || 'Check server status.'}`;
                messageArea.classList.add('text-red-500');
            }

        } catch (error) {
            console.error('Registration Network Error:', error);
            messageArea.textContent = 'Failed to connect to the server. Check console for details.';
            messageArea.classList.add('text-red-500');
        }
    });
});

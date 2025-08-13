// Gestion de l'affichage/masquage du mot de passe
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Vérification de la force du mot de passe
document.getElementById('register-password')?.addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthText = document.getElementById('strength-text');
    const strengthBar = document.querySelector('.strength-bar');
    
    // Réinitialiser
    strengthBar.className = 'strength-bar';
    strengthBar.style.width = '0%';
    
    if (password.length === 0) {
        strengthText.textContent = 'Force du mot de passe :';
        return;
    }
    
    let strength = 0;
    
    // Longueur
    if (password.length > 7) strength += 1;
    if (password.length > 11) strength += 1;
    
    // Complexité
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Mise à jour de l'UI
    if (strength <= 2) {
        strengthText.textContent = 'Force du mot de passe : faible';
        strengthBar.classList.add('weak');
        strengthBar.style.width = '33%';
    } else if (strength <= 4) {
        strengthText.textContent = 'Force du mot de passe : moyenne';
        strengthBar.classList.add('medium');
        strengthBar.style.width = '66%';
    } else {
        strengthText.textContent = 'Force du mot de passe : forte';
        strengthBar.classList.add('strong');
        strengthBar.style.width = '100%';
    }
});

// Connexion
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Erreur lors de la connexion');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion');
    }
});

// Inscription
document.getElementById('register-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'inscription');
    }
});

// Déconnexion
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
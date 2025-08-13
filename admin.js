document.addEventListener('DOMContentLoaded', () => {
    // Vérification du token admin
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') {
            alert('Accès réservé aux administrateurs');
            window.location.href = 'index.html';
        }
    } catch (e) {
        window.location.href = 'login.html';
    }

    // Navigation dans l'admin
    const navLinks = document.querySelectorAll('.admin-sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Mettre à jour la navigation active
            document.querySelector('.admin-sidebar li.active')?.classList.remove('active');
            link.parentElement.classList.add('active');
            
            // Afficher la section correspondante
            const sectionId = link.dataset.section + '-section';
            document.querySelector('.admin-section.active')?.classList.remove('active');
            document.getElementById(sectionId).classList.add('active');
            
            // Charger les données si nécessaire
            if (sectionId === 'videos-section') loadVideosTable();
            if (sectionId === 'users-section') loadUsersTable();
            if (sectionId === 'stats-section') loadStats();
        });
    });

    // Gestion de l'upload
    document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('video-title').value);
        formData.append('description', document.getElementById('video-description').value);
        formData.append('category', document.getElementById('video-category').value);
        formData.append('video', document.getElementById('video-file').files[0]);
        
        if (document.getElementById('video-thumbnail').files[0]) {
            formData.append('thumbnail', document.getElementById('video-thumbnail').files[0]);
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/videos/upload', {
                method: 'POST',
                headers: {
                    'Authorization': token
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Vidéo uploadée avec succès !');
                document.getElementById('upload-form').reset();
            } else {
                alert(result.message || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'upload');
        }
    });

    // Charger les données initiales si sur la bonne section
    if (document.querySelector('.admin-section.active').id === 'videos-section') {
        loadVideosTable();
    } else if (document.querySelector('.admin-section.active').id === 'users-section') {
        loadUsersTable();
    } else if (document.querySelector('.admin-section.active').id === 'stats-section') {
        loadStats();
    }
});

async function loadVideosTable() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/videos', {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        
        const videos = await response.json();
        const tableBody = document.querySelector('#videos-table tbody');
        tableBody.innerHTML = '';
        
        videos.forEach(video => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${video.title}</td>
                <td>${video.category || 'Non classé'}</td>
                <td>${new Date(video.uploadedAt).toLocaleDateString()}</td>
                <td>${video.views || 0}</td>
                <td>
                    <button class="btn-small edit-btn" data-id="${video._id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-small delete-btn" data-id="${video._id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Gestion des boutons d'action
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editVideo(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteVideo(btn.dataset.id));
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function loadUsersTable() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        
        const users = await response.json();
        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <select class="role-select" data-id="${user._id}">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                        <option value="subscriber" ${user.role === 'subscriber' ? 'selected' : ''}>Abonné</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-small delete-user-btn" data-id="${user._id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Gestion du changement de rôle
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', () => updateUserRole(select.dataset.id, select.value));
        });
        
        // Gestion de la suppression
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.id));
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/stats', {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        
        const stats = await response.json();
        
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-videos').textContent = stats.totalVideos;
        document.getElementById('total-views').textContent = stats.totalViews;
        document.getElementById('total-subscribers').textContent = stats.totalSubscribers;
        
        // Création du graphique
        const ctx = document.getElementById('views-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.viewsPerDay.map(day => day.date),
                datasets: [{
                    label: 'Vues par jour',
                    data: stats.viewsPerDay.map(day => day.views),
                    borderColor: '#e50914',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (!response.ok) {
            alert('Erreur lors de la mise à jour du rôle');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function deleteUser(userId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        
        if (response.ok) {
            loadUsersTable();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function editVideo(videoId) {
    // Implémentez la logique d'édition ici
    alert('Fonctionnalité d\'édition à implémenter pour la vidéo ' + videoId);
}

async function deleteVideo(videoId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/admin/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        
        if (response.ok) {
            loadVideosTable();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
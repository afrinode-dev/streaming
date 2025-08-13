// Gestion de l'authentification
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('profile-btn').style.display = 'block';
    }

    // Menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    // Chargement des vidéos
    loadVideos();
});

async function loadVideos(filter = 'all') {
    try {
        const response = await fetch('http://localhost:5000/api/videos');
        const videos = await response.json();
        
        const container = document.getElementById('videos-container');
        container.innerHTML = '';
        
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.dataset.id = video._id;
            videoCard.dataset.category = video.category || 'all';
            
            videoCard.innerHTML = `
                <img src="https://via.placeholder.com/300x169" alt="${video.title}">
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <p>${video.description.substring(0, 50)}...</p>
                </div>
            `;
            
            videoCard.addEventListener('click', () => openVideoPlayer(video));
            container.appendChild(videoCard);
        });
        
        // Filtrage par catégorie
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.dataset.category;
                const videos = document.querySelectorAll('.video-card');
                
                videos.forEach(video => {
                    if (category === 'all' || video.dataset.category === category) {
                        video.style.display = 'block';
                    } else {
                        video.style.display = 'none';
                    }
                });
            });
        });
    } catch (error) {
        console.error('Erreur lors du chargement des vidéos:', error);
    }
}

function openVideoPlayer(video) {
    const player = document.getElementById('video-player');
    const videoElement = document.getElementById('main-video');
    const videoTitle = document.getElementById('video-title');
    const videoDescription = document.getElementById('video-description');
    
    videoTitle.textContent = video.title;
    videoDescription.textContent = video.description;
    videoElement.src = `http://localhost:5000/uploads/${video.filename}`;
    
    player.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Fermeture du lecteur
    document.getElementById('close-player').addEventListener('click', () => {
        player.style.display = 'none';
        document.body.style.overflow = 'auto';
        videoElement.pause();
    });
    
    // Gestion des favoris
    const likeBtn = document.getElementById('like-btn');
    likeBtn.addEventListener('click', () => {
        toggleFavorite(video._id);
    });
}

async function toggleFavorite(videoId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Connectez-vous pour ajouter aux favoris');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/favorites/${videoId}`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Recherche
document.getElementById('search-btn').addEventListener('click', searchVideos);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchVideos();
});

async function searchVideos() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/videos/search?q=${query}`);
        const videos = await response.json();
        
        const container = document.getElementById('videos-container');
        container.innerHTML = '';
        
        if (videos.length === 0) {
            container.innerHTML = '<p>Aucun résultat trouvé</p>';
            return;
        }
        
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.innerHTML = `
                <img src="https://via.placeholder.com/300x169" alt="${video.title}">
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <p>${video.description.substring(0, 50)}...</p>
                </div>
            `;
            videoCard.addEventListener('click', () => openVideoPlayer(video));
            container.appendChild(videoCard);
        });
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
    }
}
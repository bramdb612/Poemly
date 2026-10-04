document.addEventListener('DOMContentLoaded', () => {

    let currentUser = null;
    let activeClubId = null;
    let pendingAccount = null;

    // --- LOCAL STORAGE HELPERS FOR USER PERSISTENCE ---
    function getStoredUsers() {
        const stored = localStorage.getItem('poemly_registered_users');
        if (stored) {
            try { return JSON.parse(stored); } catch(e) {}
        }
        // Default seed accounts
        const initial = {
            'alex@poemly.org': { username: 'Alex Rivers', email: 'alex@poemly.org', password: 'password123' },
            'luna@poemly.org': { username: 'Luna Star', email: 'luna@poemly.org', password: 'password123' }
        };
        localStorage.setItem('poemly_registered_users', JSON.stringify(initial));
        return initial;
    }

    function saveUserAccount(userObj) {
        const users = getStoredUsers();
        users[userObj.email.toLowerCase()] = userObj;
        localStorage.setItem('poemly_registered_users', JSON.stringify(users));
    }

    // --- LOCAL STORAGE HELPERS FOR POEMS ---
    function getStoredPoems() {
        const stored = localStorage.getItem('poemly_poems');
        if (stored) {
            try { return JSON.parse(stored); } catch(e) {}
        }
        const initial = [
            {
                id: 'poem-1',
                title: 'Golden Horizon',
                author: 'Alex Rivers',
                content: 'The sun dips low behind the hill,\nThe world grows quiet, soft, and still.\nA promise left in amber light,\nBefore we say goodnight.',
                timestamp: Date.now() - 3600000,
                likes: 12,
                likedBy: [],
                comments: [{ author: 'Luna Star', text: 'Love the warmth in this piece!' }]
            },
            {
                id: 'poem-2',
                title: 'Midnight Echoes',
                author: 'Luna Star',
                content: 'In silence of the darkest hour,\nThe stars display their subtle power.\nThey whisper dreams we left behind,\nTo soothe a weary, restless mind.',
                timestamp: Date.now() - 7200000,
                likes: 19,
                likedBy: [],
                comments: []
            }
        ];
        localStorage.setItem('poemly_poems', JSON.stringify(initial));
        return initial;
    }

    function savePoems(poemsArray) {
        localStorage.setItem('poemly_poems', JSON.stringify(poemsArray));
    }

    const poems = getStoredPoems();

    // User Profiles Memory Store
    const userProfiles = {
        'Alex Rivers': { followers: 24, isFollowed: false },
        'Luna Star': { followers: 58, isFollowed: false }
    };

    // Clubs Data
    const clubs = [
        {
            id: 'haiku-haven',
            name: 'Haiku Haven',
            description: 'A club dedicated to the 5-7-5 syllable structure.',
            members: 142,
            joined: false,
            posts: [{ author: 'Alex Rivers', content: 'Autumn leaves fall down,\nWhispering in cool breeze,\nSilent quiet night.', comments: [] }]
        }
    ];

    // Chat Rooms Data
    const chatRooms = [
        {
            id: 'global',
            title: '🌐 Global Lounge',
            isPrivate: false,
            messages: [
                { sender: 'System', text: 'Welcome to the global lounge!' },
                { sender: 'Alex Rivers', text: 'Does anyone have tips for writer block?' }
            ]
        }
    ];

    let currentRoomId = 'global';

    // DOM Elements
    const authScreen = document.getElementById('authScreen');
    const appScreen = document.getElementById('appScreen');
    
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const verifyCard = document.getElementById('verifyCard');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const verifyForm = document.getElementById('verifyForm');

    const loginError = document.getElementById('loginError');
    const regError = document.getElementById('regError');
    const verifyError = document.getElementById('verifyError');

    // ================= 1. AUTHENTICATION & PERSISTENT LOGINS =================
    
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.classList.add('hidden');
        registerCard.classList.remove('hidden');
        loginError.classList.add('hidden');
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerCard.classList.add('hidden');
        verifyCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        regError.classList.add('hidden');
    });

    document.getElementById('backToRegBtn').addEventListener('click', (e) => {
        e.preventDefault();
        verifyCard.classList.add('hidden');
        registerCard.classList.remove('hidden');
    });

    // Sign Up - Step 1
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;

        const users = getStoredUsers();
        const exists = Object.values(users).some(u => 
            u.email.toLowerCase() === email || u.username.toLowerCase() === username.toLowerCase()
        );

        if (exists) {
            regError.classList.remove('hidden');
            return;
        }

        regError.classList.add('hidden');
        
        // Generate random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        pendingAccount = { username, email, password, code };

        document.getElementById('sentEmailSpan').textContent = email;
        document.getElementById('demoCodeDisplay').textContent = code;
        
        registerCard.classList.add('hidden');
        verifyCard.classList.remove('hidden');
    });

    // Resend Code
    document.getElementById('resendCodeBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (pendingAccount) {
            pendingAccount.code = Math.floor(100000 + Math.random() * 900000).toString();
            document.getElementById('demoCodeDisplay').textContent = pendingAccount.code;
            alert(`New code generated: ${pendingAccount.code}`);
        }
    });

    // Sign Up - Step 2 (Verify Code)
    verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredCode = document.getElementById('verifyInput').value.trim();

        if (pendingAccount && enteredCode === pendingAccount.code) {
            verifyError.classList.add('hidden');
            
            const newAccount = {
                username: pendingAccount.username,
                email: pendingAccount.email,
                password: pendingAccount.password
            };

            // PERMANENT SAVE TO LOCALSTORAGE
            saveUserAccount(newAccount);

            loginSuccess(newAccount.username);
            pendingAccount = null;
            verifyForm.reset();
            registerForm.reset();
        } else {
            verifyError.classList.remove('hidden');
        }
    });

    // Login Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginIdentifier').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        const users = getStoredUsers();
        
        // Match by Email OR Username (case-insensitive)
        const user = Object.values(users).find(u => 
            u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
        );

        if (user && user.password === password) {
            loginError.classList.add('hidden');
            loginSuccess(user.username);
            loginForm.reset();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    function loginSuccess(username) {
        currentUser = username;
        if (!userProfiles[currentUser]) {
            userProfiles[currentUser] = { followers: 0, isFollowed: false };
        }

        document.getElementById('userGreeting').textContent = `Hi, ${currentUser}!`;
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        
        renderPoemFeed(poems);
        renderClubsDirectory();
        renderChatRooms();
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        appScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
        loginCard.classList.remove('hidden');
        verifyCard.classList.add('hidden');
        registerCard.classList.add('hidden');
    });

    // ================= 2. SEARCH & POEM FEED =================
    const searchInput = document.getElementById('searchInput');
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageViews = document.querySelectorAll('.page-view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            pageViews.forEach(page => page.classList.add('hidden'));
            
            const clickedBtn = e.target.closest('.nav-btn');
            clickedBtn.classList.add('active');
            document.getElementById(clickedBtn.getAttribute('data-target')).classList.remove('hidden');
        });
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelector('[data-target="view-read"]').click();

        if (query === '') {
            document.getElementById('feedTitle').textContent = 'Community Feed';
            document.getElementById('searchResultCount').classList.add('hidden');
            renderPoemFeed(poems);
        } else {
            const filtered = poems.filter(p => 
                p.title.toLowerCase().includes(query) || p.author.toLowerCase().includes(query)
            );
            document.getElementById('feedTitle').textContent = `Results for "${query}"`;
            const badge = document.getElementById('searchResultCount');
            badge.textContent = `${filtered.length} found`;
            badge.classList.remove('hidden');
            renderPoemFeed(filtered);
        }
    });

    function renderPoemFeed(poemsToRender, targetContainer = document.getElementById('poemFeed')) {
        targetContainer.innerHTML = '';
        if (poemsToRender.length === 0) {
            targetContainer.innerHTML = `<p class="subtitle-text">No poems found.</p>`;
            return;
        }

        poemsToRender.forEach(poem => {
            const card = document.createElement('article');
            card.className = 'card poem-card';
            card.dataset.id = poem.id;

            const isAuthor = poem.author === currentUser;
            const deleteBtn = isAuthor ? `<button class="btn-delete" data-timestamp="${poem.timestamp}">Delete</button>` : '';

            let commentsHTML = poem.comments.map(c => 
                `<div class="comment"><strong>${escapeHTML(c.author)}:</strong> ${escapeHTML(c.text)}</div>`
            ).join('');

            card.innerHTML = `
                <div class="poem-header">
                    <div class="header-info">
                        <h3>${escapeHTML(poem.title)}</h3>
                        <span class="author-link" data-author="${escapeHTML(poem.author)}">By ${escapeHTML(poem.author)}</span>
                    </div>
                    ${deleteBtn}
                </div>
                <div class="poem-body">${escapeHTML(poem.content)}</div>
                <div class="poem-actions">
                    <button class="btn-like ${poem.likedBy.includes(currentUser) ? 'liked' : ''}">❤️ <span class="like-count">${poem.likes}</span> Likes</button>
                </div>
                <div class="comments-section">
                    <h4>Discussion</h4>
                    <div class="comments-list">${commentsHTML}</div>
                    <form class="comment-form">
                        <input type="text" class="comment-input" placeholder="Add a comment..." required>
                        <button type="submit" class="btn-comment">Post</button>
                    </form>
                </div>
            `;
            targetContainer.appendChild(card);
        });
    }

    // Publish Poem
    document.getElementById('poemForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('poemTitle').value.trim();
        const content = document.getElementById('poemContent').value.trim();

        if (title && content) {
            poems.unshift({
                id: 'poem-' + Date.now(),
                title: title,
                author: currentUser,
                content: content,
                timestamp: Date.now(),
                likes: 0,
                likedBy: [],
                comments: []
            });

            savePoems(poems);
            document.getElementById('poemForm').reset();
            renderPoemFeed(poems);
            document.querySelector('[data-target="view-read"]').click();
        }
    });

    // Poem Card Actions
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('author-link')) {
            openPoetProfile(e.target.dataset.author);
        }

        if (e.target.closest('.btn-like')) {
            const card = e.target.closest('.poem-card');
            if (card) {
                const poem = poems.find(p => p.id === card.dataset.id);
                if (poem) {
                    if (!poem.likedBy.includes(currentUser)) {
                        poem.likes++;
                        poem.likedBy.push(currentUser);
                    } else {
                        poem.likes--;
                        poem.likedBy = poem.likedBy.filter(u => u !== currentUser);
                    }
                    savePoems(poems);
                    renderPoemFeed(poems);
                }
            }
        }

        if (e.target.classList.contains('btn-delete')) {
            const timestamp = parseInt(e.target.dataset.timestamp);
            if (Date.now() - timestamp <= 86400000) {
                if (confirm("Delete this poem permanently?")) {
                    const id = e.target.closest('.poem-card').dataset.id;
                    const idx = poems.findIndex(p => p.id === id);
                    if (idx > -1) poems.splice(idx, 1);
                    savePoems(poems);
                    renderPoemFeed(poems);
                }
            } else {
                alert("Poems can only be deleted within 24 hours of posting.");
            }
        }
    });

    // Add Comment
    document.addEventListener('submit', (e) => {
        if (e.target.classList.contains('comment-form')) {
            e.preventDefault();
            const input = e.target.querySelector('.comment-input');
            const card = e.target.closest('.poem-card');
            if (card && input.value.trim() !== '') {
                const poem = poems.find(p => p.id === card.dataset.id);
                if (poem) {
                    poem.comments.push({ author: currentUser, text: input.value.trim() });
                    savePoems(poems);
                    renderPoemFeed(poems);
                }
            }
        }
    });

    // ================= 3. POET PROFILE MODAL =================
    const profileModal = document.getElementById('poetProfileModal');
    const profileFollowBtn = document.getElementById('profileFollowBtn');

    function openPoetProfile(authorName) {
        if (!userProfiles[authorName]) userProfiles[authorName] = { followers: 0, isFollowed: false };
        const profile = userProfiles[authorName];
        const authorPoems = poems.filter(p => p.author === authorName);

        document.getElementById('profileName').textContent = authorName;
        document.getElementById('profilePoemCount').textContent = authorPoems.length;
        document.getElementById('profileFollowerCount').textContent = profile.followers;

        profileFollowBtn.dataset.author = authorName;
        profileFollowBtn.textContent = profile.isFollowed ? 'Following' : 'Follow';
        profileFollowBtn.classList.toggle('following', profile.isFollowed);

        renderPoemFeed(authorPoems, document.getElementById('profilePoemsList'));
        profileModal.classList.remove('hidden');
    }

    document.getElementById('closeProfileModal').addEventListener('click', () => profileModal.classList.add('hidden'));

    profileFollowBtn.addEventListener('click', () => {
        const author = profileFollowBtn.dataset.author;
        const profile = userProfiles[author];
        profile.isFollowed = !profile.isFollowed;
        profile.followers += profile.isFollowed ? 1 : -1;

        document.getElementById('profileFollowerCount').textContent = profile.followers;
        profileFollowBtn.textContent = profile.isFollowed ? 'Following' : 'Follow';
        profileFollowBtn.classList.toggle('following', profile.isFollowed);
    });

    // ================= 4. CLUBS SYSTEM =================
    const toggleClubFormBtn = document.getElementById('toggleClubFormBtn');
    const createClubCard = document.getElementById('createClubCard');
    const cancelClubBtn = document.getElementById('cancelClubBtn');
    const createClubForm = document.getElementById('createClubForm');

    toggleClubFormBtn.addEventListener('click', () => createClubCard.classList.remove('hidden'));
    cancelClubBtn.addEventListener('click', () => createClubCard.classList.add('hidden'));

    createClubForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('clubName').value.trim();
        const description = document.getElementById('clubDescription').value.trim();

        if (name && description) {
            clubs.unshift({
                id: 'club_' + Date.now(),
                name: name,
                description: description,
                members: 1,
                joined: true,
                posts: []
            });

            renderClubsDirectory();
            createClubForm.reset();
            createClubCard.classList.add('hidden');
        }
    });

    function renderClubsDirectory() {
        const grid = document.getElementById('clubsGrid');
        grid.innerHTML = '';
        clubs.forEach(club => {
            const clubCard = document.createElement('div');
            clubCard.className = 'card club-card';
            clubCard.innerHTML = `
                <div>
                    <h3>${escapeHTML(club.name)}</h3>
                    <p>${escapeHTML(club.description)}</p>
                </div>
                <div>
                    <p class="members-count">👥 ${club.members} Members</p>
                    <div class="club-card-actions">
                        <button class="btn-join ${club.joined ? 'joined' : ''}" data-club-id="${club.id}">
                            ${club.joined ? 'Joined' : 'Join Club'}
                        </button>
                        <button class="btn-open-club" data-club-id="${club.id}">Enter Club ➔</button>
                    </div>
                </div>
            `;
            grid.appendChild(clubCard);
        });
    }

    document.getElementById('clubsGrid').addEventListener('click', (e) => {
        const clubId = e.target.dataset.clubId;
        if (!clubId) return;

        const club = clubs.find(c => c.id === clubId);

        if (e.target.classList.contains('btn-join')) {
            club.joined = !club.joined;
            club.members += club.joined ? 1 : -1;
            renderClubsDirectory();
        }

        if (e.target.classList.contains('btn-open-club')) {
            openClubHub(club);
        }
    });

    function openClubHub(club) {
        activeClubId = club.id;
        document.getElementById('clubDetailTitle').textContent = club.name;
        document.getElementById('clubDetailDesc').textContent = club.description;
        document.getElementById('clubDetailMembers').textContent = `👥 ${club.members} Members`;

        const joinBtn = document.getElementById('clubDetailJoinBtn');
        joinBtn.textContent = club.joined ? 'Joined' : 'Join Club';
        joinBtn.className = `btn-join ${club.joined ? 'joined' : ''}`;

        renderClubFeed(club);

        document.getElementById('allClubsDirectory').classList.add('hidden');
        document.getElementById('singleClubView').classList.remove('hidden');
    }

    document.getElementById('backToClubsBtn').addEventListener('click', () => {
        activeClubId = null;
        document.getElementById('singleClubView').classList.add('hidden');
        document.getElementById('allClubsDirectory').classList.remove('hidden');
        renderClubsDirectory();
    });

    function renderClubFeed(club) {
        const clubPostFeed = document.getElementById('clubPostFeed');
        clubPostFeed.innerHTML = '';

        if (club.posts.length === 0) {
            clubPostFeed.innerHTML = `<p class="subtitle-text">No discussions here yet. Start a conversation!</p>`;
            return;
        }

        club.posts.forEach((post) => {
            const article = document.createElement('article');
            article.className = 'card poem-card';
            article.innerHTML = `
                <div class="poem-header">
                    <div class="header-info">
                        <span class="author-link" data-author="${escapeHTML(post.author)}">Posted by <strong>${escapeHTML(post.author)}</strong></span>
                    </div>
                </div>
                <div class="poem-body">${escapeHTML(post.content)}</div>
            `;
            clubPostFeed.appendChild(article);
        });
    }

    document.getElementById('clubPostForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const contentInput = document.getElementById('clubPostContent');
        const club = clubs.find(c => c.id === activeClubId);

        if (club && contentInput.value.trim() !== '') {
            club.posts.unshift({
                author: currentUser,
                content: contentInput.value.trim(),
                comments: []
            });

            contentInput.value = '';
            renderClubFeed(club);
        }
    });

    // ================= 5. PRIVATE CHATS =================
    document.getElementById('newPrivateChatBtn').addEventListener('click', () => {
        const recipient = prompt("Enter the username of the poet you want to chat with:");
        if (recipient && recipient.trim() !== "") {
            const roomId = 'priv_' + Date.now();
            const roomName = `🔒 Chat: ${recipient.trim()}`;
            
            chatRooms.push({
                id: roomId,
                title: roomName,
                isPrivate: true,
                messages: [
                    { sender: 'System', text: `Private chat room created with ${recipient.trim()}.` }
                ]
            });

            renderChatRooms();
            switchChatRoom(roomId);
        }
    });

    function renderChatRooms() {
        const list = document.getElementById('chatRoomsList');
        list.innerHTML = '';
        chatRooms.forEach(room => {
            const btn = document.createElement('button');
            btn.className = `room-item ${room.id === currentRoomId ? 'active' : ''}`;
            btn.innerHTML = `<span>${escapeHTML(room.title)}</span>`;
            btn.addEventListener('click', () => switchChatRoom(room.id));
            list.appendChild(btn);
        });
    }

    function switchChatRoom(roomId) {
        currentRoomId = roomId;
        const room = chatRooms.find(r => r.id === roomId);
        
        document.getElementById('currentRoomTitle').textContent = room.title;
        const badge = document.getElementById('roomTypeBadge');
        badge.textContent = room.isPrivate ? 'Private' : 'Public';
        badge.className = `badge ${room.isPrivate ? 'private' : ''}`;

        renderChatMessages();
        renderChatRooms();
    }

    function renderChatMessages() {
        const room = chatRooms.find(r => r.id === currentRoomId);
        const history = document.getElementById('chatHistory');
        history.innerHTML = room.messages.map(m => `
            <div class="chat-message">
                <strong>${escapeHTML(m.sender)}:</strong> ${escapeHTML(m.text)}
            </div>
        `).join('');
        history.scrollTop = history.scrollHeight;
    }

    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        if (input.value.trim() !== '') {
            const room = chatRooms.find(r => r.id === currentRoomId);
            room.messages.push({
                sender: currentUser,
                text: input.value.trim()
            });

            input.value = '';
            renderChatMessages();
        }
    });

    function escapeHTML(str) { 
        return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag] || tag)); 
    }
});

  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBKjTe0RzOxpMYl2sHocC8v045k3gUbaJk",
    authDomain: "poemly-36fdc.firebaseapp.com",
    projectId: "poemly-36fdc",
    storageBucket: "poemly-36fdc.firebasestorage.app",
    messagingSenderId: "472399699598",
    appId: "1:472399699598:web:a65f25809889445630f3df",
    measurementId: "G-KVFP8N9CY7"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
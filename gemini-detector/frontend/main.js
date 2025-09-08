// Main function runs on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5000/check_auth', { method: 'GET', credentials: 'include' });
        const result = await response.json();
        if (result.logged_in) {
            document.getElementById('app-container').style.display = 'block';
            setupUserProfile(result.username, result.is_admin); // Pass is_admin status
            setupTextAnalysis();
            setupMediaAnalysis();
            setupTabs();
        } else {
            document.getElementById('guest-container').style.display = 'block';
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        document.getElementById('guest-container').style.display = 'block';
    }
});

// Tab switching logic (unchanged)
function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            tabLinks.forEach(innerLink => innerLink.classList.remove('active'));
            link.classList.add('active');
            tabContents.forEach(content => {
                content.id === tabId ? content.classList.add('active') : content.classList.remove('active');
            });
        });
    });
}

// --- THIS IS THE UPDATED FUNCTION ---
function setupUserProfile(username, isAdmin) {
    const profileSection = document.getElementById('profile-section');
    const firstLetter = username.charAt(0).toUpperCase();
    const profileIcon = document.createElement('div');
    profileIcon.className = 'profile-icon';
    profileIcon.textContent = firstLetter;
    
    const dropdown = document.createElement('div');
    // Build the dropdown HTML
    let dropdownHtml = `
        <div class="profile-dropdown">
            <a href="/profile.html">Profile</a>`;

    // If the user is an admin, add the dashboard link
    if (isAdmin) {
        dropdownHtml += `<a href="/admin/dashboard.html">Admin Dashboard</a>`;
    }

    dropdownHtml += `<button id="logout-button">Logout</button></div>`;
    dropdown.innerHTML = dropdownHtml;

    profileIcon.addEventListener('click', () => {
        const drop = dropdown.querySelector('.profile-dropdown');
        drop.style.display = drop.style.display === 'none' ? 'block' : 'none';
    });

    profileSection.appendChild(profileIcon);
    profileSection.appendChild(dropdown);

    document.getElementById('logout-button').addEventListener('click', async () => {
        await fetch('http://localhost:5000/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/login.html';
    });
}

// Text and Media analysis functions are unchanged
function setupTextAnalysis() {
    const analyzeButton = document.getElementById('analyze-text-button');
    const textInput = document.getElementById('text-input');
    const resultContainer = document.getElementById('result-container');
    analyzeButton.addEventListener('click', async () => {
        const textToAnalyze = textInput.value;
        if (!textToAnalyze.trim()) { resultContainer.innerHTML = '<p style="color:red;">Please enter some text.</p>'; return; }
        resultContainer.innerHTML = '<div class="spinner"></div>';
        try {
            const response = await fetch('http://localhost:5000/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToAnalyze }),
                credentials: 'include',
            });
            const result = await response.json();
            if (response.ok) {
                resultContainer.innerHTML = `<strong>AI Analysis:</strong><pre>${result.analysis}</pre>`;
                showReviewForm(result.post_id, resultContainer);
            } else { resultContainer.innerHTML = `<p style="color:red;">Error: ${result.error}</p>`; }
        } catch (error) { resultContainer.innerHTML = `<p style="color:red;">A network error occurred.</p>`; }
    });
}
function setupMediaAnalysis() {
    const mediaButton = document.getElementById('analyze-media-button');
    const fileInput = document.getElementById('file-input');
    const promptInput = document.getElementById('media-prompt-input');
    const resultContainer = document.getElementById('result-container');
    const fileNameDisplay = document.getElementById('file-name-display');
    fileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file chosen';
    });
    mediaButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        const prompt = promptInput.value;
        if (!file) { resultContainer.innerHTML = '<p style="color:red;">Please select a file.</p>'; return; }
        if (!prompt.trim()) { resultContainer.innerHTML = '<p style="color:red;">Please enter an instruction.</p>'; return; }
        resultContainer.innerHTML = '<div class="spinner"></div>';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prompt', prompt);
        try {
            const response = await fetch('http://localhost:5000/analyze-media', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            const result = await response.json();
            if (response.ok) {
                resultContainer.innerHTML = `<strong>AI Analysis:</strong><pre>${result.analysis}</pre>`;
                showReviewForm(result.post_id, resultContainer);
            } else { resultContainer.innerHTML = `<p style="color:red;">Error: ${result.error}</p>`; }
        } catch (error) { resultContainer.innerHTML = `<p style="color:red;">A network error occurred.</p>`; }
    });
}
function showReviewForm(postId, container) {
    const formHtml = `
        <div class="review-form-container">
            <hr>
            <p>Was this analysis helpful?</p>
            <textarea id="review-content-${postId}" placeholder="Provide your feedback..."></textarea>
            <button id="submit-review-${postId}">Submit Review</button>
            <p id="review-message-${postId}" class="review-message"></p>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById(`submit-review-${postId}`).addEventListener('click', async () => {
        const content = document.getElementById(`review-content-${postId}`).value;
        const messageEl = document.getElementById(`review-message-${postId}`);
        if (!content.trim()) {
            messageEl.textContent = 'Please enter your feedback.';
            messageEl.style.color = 'red';
            return;
        }
        const response = await fetch('http://localhost:5000/submit_review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: postId, content: content }),
            credentials: 'include',
        });
        if (response.ok) {
            messageEl.textContent = 'Thank you! Your feedback was submitted.';
            messageEl.style.color = 'green';
            document.getElementById(`review-content-${postId}`).disabled = true;
            document.getElementById(`submit-review-${postId}`).disabled = true;
        } else {
            messageEl.textContent = 'Failed to submit review. Please try again.';
            messageEl.style.color = 'red';
        }
    });
}
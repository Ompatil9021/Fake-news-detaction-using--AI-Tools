// This function is for the dropdown icon in the header
async function checkAdminAndSetupProfile() {
    try {
        const response = await fetch('http://localhost:5000/check_auth', { method: 'GET', credentials: 'include' });
        const result = await response.json();

        // Security Check: If not logged in or not an admin, deny access
        if (!result.logged_in || !result.is_admin) {
            document.querySelector('main').innerHTML = `
                <div class="admin-panel" style="text-align:center;">
                    <h1>Access Denied</h1>
                    <p>You must be an admin to view this page.</p>
                    <a href="/index.html" class="button-link">Go to Homepage</a>
                </div>`;
            return; // Stop further execution
        }

        // If admin, setup the profile icon and fetch reviews
        setupUserProfile(result.username, result.is_admin);
        fetchAndDisplayReviews();

    } catch (error) {
         document.querySelector('main').innerHTML = `<h1>Error</h1><p>Could not connect to the server.</p>`;
    }
}

async function fetchAndDisplayReviews() {
    try {
        const response = await fetch('http://localhost:5000/admin/reviews', {
            method: 'GET',
            credentials: 'include',
        });
        const reviews = await response.json();
        const container = document.getElementById('reviews-table-container');

        if (!response.ok) {
            container.innerHTML = `<p style="color:red;">Error: ${reviews.error}</p>`;
            return;
        }

        if (reviews.length === 0) {
            container.innerHTML = '<p>No user reviews have been submitted yet.</p>';
            return;
        }

        // Build the table HTML
        let tableHtml = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Reviewed By</th>
                        <th>Review Content</th>
                        <th>Original Post By</th>
                        <th>Original Post</th>
                        <th>Original AI Analysis</th>
                    </tr>
                </thead>
                <tbody>
        `;

        reviews.forEach(review => {
            tableHtml += `
                <tr>
                    <td>${review.reviewed_by_user}</td>
                    <td>${review.review_content}</td>
                    <td>${review.original_post_author}</td>
                    <td><div class="cell-content">${review.original_post_content}</div></td>
                    <td><div class="cell-content">${review.original_ai_analysis}</div></td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

    } catch (error) {
        document.getElementById('reviews-table-container').innerHTML = `<p style="color:red;">Failed to fetch reviews.</p>`;
    }
}

// This is the same setupUserProfile function from our other JS files
function setupUserProfile(username, isAdmin) {
    const profileSection = document.getElementById('profile-section');
    const firstLetter = username.charAt(0).toUpperCase();
    const profileIcon = document.createElement('div');
    profileIcon.className = 'profile-icon';
    profileIcon.textContent = firstLetter;
    let dropdownHtml = `<div class="profile-dropdown"><a href="/profile.html">Profile</a>`;
    if (isAdmin) { dropdownHtml += `<a href="/admin/dashboard.html">Admin Dashboard</a>`; }
    dropdownHtml += `<button id="logout-button">Logout</button></div>`;
    const dropdown = document.createElement('div');
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

// Run the initial check when the page loads
document.addEventListener('DOMContentLoaded', checkAdminAndSetupProfile);
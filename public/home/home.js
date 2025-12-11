async function getUserData(params) {
    try {
        const res = await fetch('/home', {
            method: 'GET'
        });

        if (!res.ok) {
            const errMsg = await res.text();
            alert('Login failed: ' + errMsg);
            return;
        }

        const userData = await res.json();
        if (!userData || !userData.username) {
            alert('User data not found or invalid response');
            return;
        }
        // Display user data on the page
        document.getElementById('user-name').innerText = `Welcome, ${userData.username}!`;

        // alert('Login successful! Redirecting to home...');
        // window.location.href = '/'; // Redirect to homepage
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Call the function to get user data when the page loads   
    getUserData();
    document.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            const res = await fetch('/logout', {
                method: 'POST'
            });

            if (!res.ok) {
                const errMsg = await res.text();
                alert('Logout failed: ' + errMsg);
                return;
            }

            alert('Logout successful! Redirecting to login page...');
            window.location.href = '/login'; // Redirect to login page
        } catch (error) {
            alert('Network error: ' + error.message);
        }
    });
});
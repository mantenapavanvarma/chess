document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevent normal form submission
  
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries()); // Convert to object
  
      try {
        const res = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
  
        if (!res.ok) {
          const errMsg = await res.text();
          alert('Signup failed: ' + errMsg);
          return;
        }

        const result = await res.json();
        alert('Signup successful! Redirecting to login...');
        window.location.href = '/login'; // Redirect to homepage
      } catch (error) {
        alert('Network error: ' + error.message);
      }
    });
  });
  
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
          const res = await fetch('/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });

          if (!res.ok) {
              const errMsg = await res.text();
              alert('Login failed: ' + errMsg);
              return;
          }


          alert('Login successful! Redirecting to home...');
          window.location.href = '/'; // Redirect to homepage
      } catch (error) {
          alert('Network error: ' + error.message);
      }
  });
});

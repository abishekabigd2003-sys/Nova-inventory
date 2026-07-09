async function login() {
  try {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@inventory.com', password: 'Admin@123!' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Login result:', data);
  } catch (error) {
    console.error('Login failed:', error);
  }
}
login();

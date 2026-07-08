import axios from 'axios';
import 'dotenv/config';

const testApiLogin = async () => {
  try {
    const res = await axios.post('http://127.0.0.1:5001/api/auth/login', {
      email: 'admin@inventory.com',
      password: 'Admin@123!'
    });
    console.log('Login successful:', res.data);
  } catch (error) {
    console.error('Login failed:', error.response?.status, error.response?.data);
  }
};
testApiLogin();

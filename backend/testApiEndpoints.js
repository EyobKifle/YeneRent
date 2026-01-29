import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@yenerent.com';
const ADMIN_PASSWORD = 'admin123';

// Function to log in and get JWT token
async function getAuthToken() {
  try {
    console.log('Attempting to log in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const token = response.data.token;
    if (!token) {
      throw new Error('Login failed, no token received.');
    }
    console.log('Login successful. Token received.');
    return token;
  } catch (error) {
    console.error('Error during login:', error.response ? error.response.data : error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  CONNECTION REFUSED');
      console.error('The backend server is not running.');
      console.error('Please open a NEW terminal and run: node backend/server.js');
    }
    process.exit(1);
  }
}

// Function to test a single endpoint
async function testEndpoint(token, endpoint, description) {
  try {
    console.log(`\n--- Testing: ${description} ---`);
    console.log(`GET ${API_BASE_URL}${endpoint}`);
    
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Status:', response.status);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(`Error testing ${description}:`, error.response ? error.response.data : error.message);
    console.error('Status:', error.response ? error.response.status : 'N/A');
  }
}

// Main function to run all tests
async function runApiTests() {
  const token = await getAuthToken();

  await testEndpoint(token, '/properties/stats', 'Property Statistics');
  await testEndpoint(token, '/payments/analytics/summary', 'Payment Analytics');
  await testEndpoint(token, '/tenants/stats/overview', 'Tenant Statistics');
  await testEndpoint(token, '/analytics/search/global?q=apartment', 'Global Search');
  await testEndpoint(token, '/analytics/reports/comprehensive?month=12&year=2024', 'Comprehensive Reports');

  console.log('\n--- All API tests completed. ---');
}

runApiTests();
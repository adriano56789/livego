// Comprehensive API Test Script (ES Module version)
// This script tests all the backend APIs to verify they are working correctly

import http from 'http';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 10755083;
const TEST_STREAM_ID = 'stream_001';
const TEST_GIFT_ID = 'gift_001';

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('Testing Health Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && response.data.status === 'OK') {
      console.log('✅ Health endpoint working');
      return true;
    } else {
      console.log('❌ Health endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testVersionEndpoint() {
  console.log('Testing Version Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/version',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && response.data.latestVersion) {
      console.log('✅ Version endpoint working');
      return true;
    } else {
      console.log('❌ Version endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Version endpoint error:', error.message);
    return false;
  }
}

async function testGetUser() {
  console.log('Testing Get User Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/users/${TEST_USER_ID}`,
      method: 'GET'
    });
    
    if (response.statusCode === 200 && response.data.id === TEST_USER_ID) {
      console.log('✅ Get user endpoint working');
      return true;
    } else {
      console.log('❌ Get user endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Get user endpoint error:', error.message);
    return false;
  }
}

async function testGetStreams() {
  console.log('Testing Get Streams Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/streams',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      console.log('✅ Get streams endpoint working');
      return true;
    } else {
      console.log('❌ Get streams endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Get streams endpoint error:', error.message);
    return false;
  }
}

async function testGetStreamById() {
  console.log('Testing Get Stream By ID Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/streams/${TEST_STREAM_ID}`,
      method: 'GET'
    });
    
    if (response.statusCode === 200 && response.data.id === TEST_STREAM_ID) {
      console.log('✅ Get stream by ID endpoint working');
      return true;
    } else {
      console.log('❌ Get stream by ID endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Get stream by ID endpoint error:', error.message);
    return false;
  }
}

async function testGetGifts() {
  console.log('Testing Get Gifts Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/gifts',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      console.log('✅ Get gifts endpoint working');
      return true;
    } else {
      console.log('❌ Get gifts endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Get gifts endpoint error:', error.message);
    return false;
  }
}

async function testJoinStream() {
  console.log('Testing Join Stream Endpoint...');
  try {
    const postData = JSON.stringify({
      userId: TEST_USER_ID
    });
    
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/streams/${TEST_STREAM_ID}/join`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    if (response.statusCode === 200 && response.data.success === true) {
      console.log('✅ Join stream endpoint working');
      return true;
    } else {
      console.log('❌ Join stream endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Join stream endpoint error:', error.message);
    return false;
  }
}

async function testLeaveStream() {
  console.log('Testing Leave Stream Endpoint...');
  try {
    const postData = JSON.stringify({
      userId: TEST_USER_ID
    });
    
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/streams/${TEST_STREAM_ID}/leave`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    if (response.statusCode === 200 && response.data.success === true) {
      console.log('✅ Leave stream endpoint working');
      return true;
    } else {
      console.log('❌ Leave stream endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Leave stream endpoint error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  const tests = [
    testHealthEndpoint,
    testVersionEndpoint,
    testGetUser,
    testGetStreams,
    testGetStreamById,
    testGetGifts,
    testJoinStream,
    testLeaveStream
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
    }
    console.log(''); // Add spacing between tests
  }
  
  console.log(`\n🏁 Test Results: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All API endpoints are working correctly!');
  } else {
    console.log('⚠️  Some API endpoints may need attention.');
  }
}

// Run the tests
runAllTests().catch(console.error);
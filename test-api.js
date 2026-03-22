#!/usr/bin/env node

/**
 * Quick Test Script for AI Interview Platform
 * Tests all major API endpoints
 * 
 * Usage: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testRegister() {
  console.log(`\n${colors.blue}=== TEST 1: Register User ===${colors.reset}`);
  
  const userData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };

  try {
    const response = await makeRequest('POST', '/users/register', userData);
    
    if (response.status === 201 && response.data.token) {
      authToken = response.data.token;
      console.log(`${colors.green}✓ Registration Successful${colors.reset}`);
      console.log(`  User: ${response.data.name}`);
      console.log(`  Email: ${response.data.email}`);
      console.log(`  Token saved for further requests`);
      return true;
    } else {
      console.log(`${colors.red}✗ Registration Failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Request Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testGetProfile() {
  console.log(`\n${colors.blue}=== TEST 2: Get User Profile ===${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', '/users/profile');
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Profile Retrieved${colors.reset}`);
      console.log(`  Name: ${response.data.name}`);
      console.log(`  Email: ${response.data.email}`);
      console.log(`  Total Interviews: ${response.data.totalInterviews}`);
      console.log(`  Average Score: ${response.data.averageScore}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to get profile${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Request Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testStartInterview() {
  console.log(`\n${colors.blue}=== TEST 3: Start Interview ===${colors.reset}`);
  
  const interviewData = {
    role: 'MERN Stack Developer',
    level: 'Junior',
    interviewType: 'voice',
    count: 3
  };

  try {
    const response = await makeRequest('POST', '/interview/start', interviewData);
    
    if (response.status === 201 && response.data.sessionId) {
      console.log(`${colors.green}✓ Interview Started${colors.reset}`);
      console.log(`  Session ID: ${response.data.sessionId}`);
      console.log(`  Role: ${response.data.role}`);
      console.log(`  Level: ${response.data.level}`);
      console.log(`  Questions Count: ${response.data.totalQuestions}`);
      console.log(`  First Question: "${response.data.questions[0].substring(0, 50)}..."`);
      
      // Save session ID for next test
      global.sessionId = response.data.sessionId;
      global.questions = response.data.questions;
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to start interview${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Request Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSubmitAnswer() {
  console.log(`\n${colors.blue}=== TEST 4: Submit Answer ===${colors.reset}`);
  
  if (!global.sessionId) {
    console.log(`${colors.yellow}⊘ Skipped: No active session${colors.reset}`);
    return false;
  }

  const answerData = {
    sessionId: global.sessionId,
    questionIndex: 0,
    answerText: 'This is a test answer demonstrating the interview flow.'
  };

  try {
    const response = await makeRequest('POST', '/interview/submit-answer', answerData);
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Answer Submitted${colors.reset}`);
      console.log(`  Question Index: ${response.data.questionIndex}`);
      console.log(`  Transcription: "${response.data.transcription.substring(0, 50)}..."`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to submit answer${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Request Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testEvaluateAnswer() {
  console.log(`\n${colors.blue}=== TEST 5: Evaluate Answer ===${colors.reset}`);
  
  if (!global.sessionId) {
    console.log(`${colors.yellow}⊘ Skipped: No active session${colors.reset}`);
    return false;
  }

  const evaluationData = {
    sessionId: global.sessionId,
    questionIndex: 0
  };

  try {
    const response = await makeRequest('POST', '/interview/evaluate-answer', evaluationData);
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Answer Evaluated${colors.reset}`);
      console.log(`  Technical Score: ${response.data.evaluation.technicalScore}/100`);
      console.log(`  Confidence Score: ${response.data.evaluation.confidenceScore}/100`);
      console.log(`  Session Score: ${response.data.sessionScore}/100`);
      console.log(`  Feedback: "${response.data.evaluation.aiFeedback.substring(0, 50)}..."`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to evaluate answer${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Request Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testGetSessions() {
  console.log(`\n${colors.blue}=== TEST 6: Get All Sessions ===${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', '/interview/sessions/list');
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Sessions Retrieved${colors.reset}`);
      console.log(`  Total Sessions: ${response.data.sessions.length}`);
      
      if (response.data.sessions.length > 0) {
        const latest = response.data.sessions[0];
        console.log(`  Latest Session:`);
        console.log(`    Role: ${latest.role}`);
        console.log(`    Score: ${latest.overallScore || 'Pending'}`);
        console.log(`    Status: ${latest.status}`);
      }
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to get sessions${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Request Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testHealthCheck() {
  console.log(`\n${colors.blue}=== TEST 0: Health Check ===${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', '');
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Backend Server is Running${colors.reset}`);
      console.log(`  Response: "${response.data}"`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Backend Server Not Running${colors.reset}`);
    console.log(`  Make sure to start the backend: cd backend && npm run dev`);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   AI Interview Platform - API Test Suite              ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  
  const tests = [
    testHealthCheck,
    testRegister,
    testGetProfile,
    testStartInterview,
    testSubmitAnswer,
    testEvaluateAnswer,
    testGetSessions
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      console.error(`${colors.red}Test error: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset} | ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed. Check your setup.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(console.error);

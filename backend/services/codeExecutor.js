/**
 * Code Executor - Safely execute and test user-submitted code
 * Uses vm2 for sandboxed execution to prevent malicious code
 */

import { VM } from 'vm2';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Execute JavaScript code safely in a sandboxed environment
 * @param {string} code - User-submitted code
 * @param {array} testCases - Array of {input: any, expectedOutput: any}
 * @param {number} timeout - Execution timeout in milliseconds
 * @returns {object} {passed: number, failed: number, results: array, executionTime: number}
 */
export const executeJavaScriptCode = async (code, testCases = [], timeout = 5000) => {
    const results = [];
    const startTime = Date.now();

    try {
        // Validate code is not empty
        if (!code || code.trim().length === 0) {
            return {
                passed: 0,
                failed: 0,
                results: [],
                error: 'Code is empty',
                executionTime: 0
            };
        }

        // Extract function name from code (look for 'function xyz' or 'const xyz =' or 'let xyz =')
        const functionNameMatch = code.match(/(?:function|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[\s\(=]/);
        if (!functionNameMatch) {
            return {
                passed: 0,
                failed: 0,
                results: [],
                error: 'No valid function definition found',
                executionTime: Date.now() - startTime
            };
        }

        const functionName = functionNameMatch[1];

        // Test without provided test cases - just syntax validation
        if (!testCases || testCases.length === 0) {
            try {
                // Just compile the code to check for syntax errors
                const vm = new VM({
                    timeout: timeout,
                    sandbox: {
                        console: { log: () => {} } // Suppress console output
                    }
                });

                vm.run(code);

                return {
                    passed: 1,
                    failed: 0,
                    results: [
                        {
                            testCase: 'Syntax validation',
                            status: 'passed',
                            error: null,
                            output: 'Code compiled successfully'
                        }
                    ],
                    executionTime: Date.now() - startTime
                };
            } catch (syntaxError) {
                return {
                    passed: 0,
                    failed: 1,
                    results: [
                        {
                            testCase: 'Syntax validation',
                            status: 'failed',
                            error: syntaxError.message,
                            output: null
                        }
                    ],
                    executionTime: Date.now() - startTime
                };
            }
        }

        // Execute with test cases
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];

            try {
                const vm = new VM({
                    timeout: timeout,
                    sandbox: {
                        console: { log: () => {} }
                    }
                });

                // Create sandbox with the user's code and call the function
                const fullCode = `
                    ${code};
                    function testExecution(input) {
                        return ${functionName}(input);
                    }
                `;

                vm.run(fullCode);
                const result = vm.run(`testExecution(${JSON.stringify(testCase.input)})`);

                // Compare result with expected output
                const passed = JSON.stringify(result) === JSON.stringify(testCase.expectedOutput);

                results.push({
                    testCase: i + 1,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput: result,
                    status: passed ? 'passed' : 'failed',
                    error: null
                });
            } catch (error) {
                results.push({
                    testCase: i + 1,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput: null,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        const executionTime = Date.now() - startTime;
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.length - passed;

        return {
            passed,
            failed,
            results,
            executionTime,
            totalTests: results.length
        };
    } catch (error) {
        return {
            passed: 0,
            failed: testCases.length || 1,
            results: [],
            error: error.message,
            executionTime: Date.now() - startTime
        };
    }
};

/**
 * Execute Python code safely
 * @param {string} code - User-submitted Python code
 * @param {array} testCases - Array of {input: any, expectedOutput: any}
 * @returns {object} Execution results
 */
export const executePythonCode = async (code, testCases = []) => {
    try {
        // For Python execution, we call the AI service's code execution endpoint
        // This assumes the AI service has Python execution capabilities
        const response = await axios.post(`${AI_SERVICE_URL}/execute-python`, {
            code,
            testCases,
            timeout: 5000
        });

        return response.data;
    } catch (error) {
        return {
            passed: 0,
            failed: testCases.length || 1,
            results: [],
            error: error.message,
            language: 'python'
        };
    }
};

/**
 * Evaluate code quality based on execution results
 * @param {object} executionResults - Results from executeJavaScriptCode or executePythonCode
 * @returns {object} {qualityScore: 0-100, feedback: string}
 */
export const evaluateCodeQuality = (executionResults) => {
    const { passed = 0, failed = 0, totalTests = 1, error, executionTime = 0 } = executionResults;

    // Base score on test passage rate
    const passRate = passed / totalTests;
    let qualityScore = Math.round(passRate * 100);

    let feedback = '';

    if (error) {
        qualityScore = 0;
        feedback = `❌ Compilation/Execution Error: ${error}`;
    } else if (passed === totalTests && totalTests > 0) {
        qualityScore = 100;
        feedback = '✅ All test cases passed! Excellent implementation.';
    } else if (passed === 0) {
        qualityScore = 0;
        feedback = `❌ No test cases passed. Review the logic and edge cases.`;
    } else if (passed >= totalTests * 0.8) {
        qualityScore = 85;
        feedback = `✅ Most test cases passed (${passed}/${totalTests}). Check edge cases.`;
    } else if (passed >= totalTests * 0.5) {
        qualityScore = 60;
        feedback = `⚠️ About half the test cases passed (${passed}/${totalTests}). Debug the failing cases.`;
    } else {
        qualityScore = 40;
        feedback = `⚠️ Few test cases passed (${passed}/${totalTests}). Review the algorithm.`;
    }

    // Time penalty for inefficient code (if execution time > 1 second)
    if (executionTime > 1000) {
        qualityScore = Math.max(0, qualityScore - 15);
        feedback += ` ⏱️ Execution is slow (${executionTime}ms).`;
    }

    return {
        qualityScore: Math.min(100, Math.max(0, qualityScore)),
        feedback: feedback.trim(),
        testPassRate: passRate,
        totalTests
    };
};

/**
 * Get enhanced AI evaluation combining execution results with LLM analysis
 * @param {string} code - User code
 * @param {object} executionResults - Results from code executor
 * @param {string} question - Original interview question
 * @param {string} role - Candidate role
 * @param {string} level - Experience level
 * @returns {object} {totalScore: 0-100, feedback: string, strengths: array, improvements: array}
 */
export const getEnhancedCodeEvaluation = async (code, executionResults, question, role, level) => {
    try {
        // Get quality score from execution
        const executionQuality = evaluateCodeQuality(executionResults);

        // Ask AI service for additional code review
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/evaluate`, {
            question,
            question_type: 'coding',
            role,
            level,
            user_code: code
        }).catch(() => null);

        if (!aiResponse) {
            // Fallback if AI service unavailable
            return {
                totalScore: executionQuality.qualityScore,
                feedback: executionQuality.feedback,
                strengths: ['Code executed successfully'],
                improvements: ['Add more detailed comments', 'Consider edge cases'],
                executionResults: executionResults,
                source: 'execution-only'
            };
        }

        // Combine execution quality with AI feedback
        const executionWeight = 0.6; // 60% weight on actual execution
        const aiWeight = 0.4; // 40% weight on AI analysis

        const aiScore = aiResponse.data.technicalScore || 70;
        const combinedScore = Math.round(
            executionQuality.qualityScore * executionWeight + aiScore * aiWeight
        );

        return {
            totalScore: combinedScore,
            feedback: `${executionQuality.feedback}\n\n${aiResponse.data.aiFeedback}`,
            idealAnswer: aiResponse.data.idealAnswer,
            executionResults: executionResults,
            codeQuality: executionQuality,
            source: 'combined'
        };
    } catch (error) {
        console.error('Error in enhanced evaluation:', error);
        const executionQuality = evaluateCodeQuality(executionResults);
        return {
            totalScore: executionQuality.qualityScore,
            feedback: executionQuality.feedback,
            strengths: [],
            improvements: [],
            executionResults: executionResults,
            source: 'execution-only',
            error: error.message
        };
    }
};

export default {
    executeJavaScriptCode,
    executePythonCode,
    evaluateCodeQuality,
    getEnhancedCodeEvaluation
};

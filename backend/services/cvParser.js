import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';

/**
 * Extract text from PDF
 */
export const extractTextFromPDF = async (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(fileBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF');
    }
};

/**
 * Parse CV and extract key information
 */
export const parseCV = (cvText) => {
    try {
        const result = {
            skills: extractSkills(cvText),
            experience: extractExperience(cvText),
            projects: extractProjects(cvText),
            education: extractEducation(cvText),
            summary: generateSummary(cvText),
            yearsOfExperience: calculateExperience(cvText),
            technicalKeywords: extractTechnicalKeywords(cvText),
        };

        return result;
    } catch (error) {
        console.error('CV parsing error:', error);
        throw new Error('Failed to parse CV content');
    }
};

/**
 * Extract skills from CV text - ENHANCED with dynamic skill detection
 */
const extractSkills = (text) => {
    const skillPatterns = [
        /(?:skills?|expertise|technologies?|proficiencies?)[:\s]+(.*?)(?:experience|projects?|education|$)/gi,
        /(?:technical\s+)?skills?[:\s]+(.*?)(?:\n\n|projects|experience|$)/gi,
    ];

    let skills = [];
    
    skillPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1]) {
                const skillText = match[1];
                const skillList = skillText
                    .split(/[,•\n-]/)
                    .map(s => s.trim())
                    .filter(s => s && s.length > 2 && s.length < 50);
                skills.push(...skillList);
            }
        }
    });

    // ENHANCED: Extended tech stack with emerging technologies
    const commonTechs = [
        // Languages
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
        'Kotlin', 'Swift', 'Scala', 'Elixir', 'Haskell', 'R', 'MATLAB', 'Lua',
        // Frontend Frameworks
        'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Remix', 'Astro', 'Solid',
        // Backend Frameworks
        'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Nestjs',
        'ASP.NET', 'Rails', 'Laravel', 'Go Gin', 'Echo',
        // Databases
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'DynamoDB', 'Cassandra',
        'Elasticsearch', 'Firebase', 'Supabase', 'CockroachDB', 'Prisma',
        // APIs & Protocols
        'GraphQL', 'REST API', 'gRPC', 'WebSocket', 'Socket.io',
        // Cloud & DevOps
        'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
        'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Vercel', 'Netlify',
        // Frontend Styling & Tools
        'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS', 'Webpack', 'Vite', 'Parcel',
        'PostCSS', 'Styled Components', 'Material UI',
        // Testing & Quality
        'Testing', 'Jest', 'Unit Testing', 'Integration Testing', 'E2E Testing',
        'Cypress', 'Selenium', 'Vitest', 'Mocha', 'Chai', 'Pytest',
        // Emerging Tech
        'AI', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
        'LLM', 'LangChain', 'OpenAI', 'Ollama', 'Hugging Face',
        // Blockchain & Web3
        'Blockchain', 'Smart Contracts', 'Solidity', 'Web3', 'Ethereum',
        // Data & Big Data
        'BigQuery', 'Apache Spark', 'Hadoop', 'Data Pipeline', 'ETL',
        // Monitoring & Observability
        'DataDog', 'New Relic', 'Prometheus', 'Grafana', 'Sentry',
        // Version Control
        'Git', 'GitHub', 'GitLab', 'Bitbucket',
        // Mobile
        'React Native', 'Flutter', 'Ionic',
        // Other Important
        'API', 'Database', 'DevOps', 'Cloud', 'Microservices', 'Distributed Systems',
        'Performance', 'Scalability', 'Security', 'CI/CD', 'Agile', 'Leadership',
        'Real-time', 'Caching'
    ];

    const foundTechs = [];
    commonTechs.forEach(tech => {
        // Case-insensitive search
        const techRegex = new RegExp(`\\b${tech.replace(/[+]/g, '\\+')}\\b`, 'i');
        if (techRegex.test(text)) {
            foundTechs.push(tech);
        }
    });

    // DYNAMIC SKILL DETECTION: Look for patterns like "X.js", "X-CLI", etc.
    const dynamicPatterns = [
        /(\w+\.js\b)/gi,  // Any .js library
        /(\w+-cli\b)/gi,  // Any CLI tool
        /(\w+ framework\b)/gi,  // Any framework
    ];

    const dynamicSkills = [];
    dynamicPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length < 50) {
                dynamicSkills.push(match[1]);
            }
        }
    });

    // Combine: extracted + common + dynamic
    const allSkills = [...new Set([...skills, ...foundTechs, ...dynamicSkills])];
    
    return allSkills.slice(0, 50); // Return top 50 skills (increased from 30)
};

/**
 * Extract work experience
 */
const extractExperience = (text) => {
    const experiences = [];
    
    // Look for job titles and companies
    const patterns = [
        /(?:^|\n)([A-Z][^\n]*?)(?:\s+at\s+)([A-Z][^\n]*?)(?:\n|$)/gm,
        /(?:^|\n)([A-Z][^•\n]*?)\s+\(([^)]*?)\)/gm,
    ];

    patterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[2]) {
                experiences.push({
                    title: match[1].trim(),
                    company: match[2].trim(),
                });
            }
        }
    });

    return experiences.slice(0, 10);
};

/**
 * Extract projects
 */
const extractProjects = (text) => {
    const projects = [];
    
    const projectPattern = /(?:projects?|portfolio|work)[:\s]+(.*?)(?:education|skills|experience|$)/gis;
    const matches = text.matchAll(projectPattern);

    for (const match of matches) {
        if (match[1]) {
            const projectText = match[1];
            const projectLines = projectText.split('\n').filter(l => l.trim().length > 10);
            projectLines.slice(0, 5).forEach(line => {
                projects.push(line.trim());
            });
        }
    }

    return projects;
};

/**
 * Extract education
 */
const extractEducation = (text) => {
    const education = [];
    
    const degreePattern = /(?:^|\n)((?:Bachelor|Master|Ph\.D|B\.S|M\.S|MBA|BCA|B\.Tech|M\.Tech)[^\n]*?)(?:\n|$)/gi;
    const matches = text.matchAll(degreePattern);

    for (const match of matches) {
        if (match[1]) {
            education.push(match[1].trim());
        }
    }

    return education.slice(0, 5);
};

/**
 * Calculate years of experience
 */
const calculateExperience = (text) => {
    const yearPattern = /(\d{4})\s*-\s*(?:(\d{4})|present|current)/gi;
    const matches = text.matchAll(yearPattern);
    
    let totalMonths = 0;
    let expCount = 0;

    for (const match of matches) {
        const startYear = parseInt(match[1]);
        const endYear = match[2] ? parseInt(match[2]) : new Date().getFullYear();
        
        if (startYear < endYear) {
            totalMonths += (endYear - startYear) * 12;
            expCount++;
        }
    }

    if (expCount === 0) {
        // Try to find single years mentioned
        const yearsPattern = /(\d+)\s+years?\s+of\s+experience/gi;
        const yearMatches = text.matchAll(yearsPattern);
        
        for (const match of yearMatches) {
            return parseInt(match[1]);
        }
        
        return 0;
    }

    return Math.round(totalMonths / (expCount * 12));
};

/**
 * Extract technical keywords for question personalization - ENHANCED
 */
const extractTechnicalKeywords = (text) => {
    const keywords = [];
    
    // ENHANCED: More comprehensive keyword list including emerging tech
    const techKeywords = [
        // Architecture & Systems
        'API', 'Database', 'Microservices', 'Distributed Systems', 'Real-time',
        'Performance', 'Scalability', 'Security', 'CI/CD', 'Leadership',
        'Event Driven', 'Serverless', 'CQRS', 'Event Sourcing',
        // AI/ML
        'Machine Learning', 'AI', 'Deep Learning', 'NLP', 'Computer Vision',
        'LLM', 'Prompt Engineering', 'Fine-tuning', 'RAG',
        // DevOps & Cloud
        'DevOps', 'Cloud', 'Infrastructure', 'Monitoring', 'Logging',
        'Observability', 'SRE', 'IaC', 'Container Orchestration',
        // Testing & Quality
        'Testing', 'TDD', 'BDD', 'Code Coverage', 'Performance Testing',
        'Load Testing', 'Security Testing', 'Accessibility',
        // Methodologies
        'Agile', 'Scrum', 'Kanban', 'Pair Programming', 'Code Review',
        'Documentation', 'Technical Writing', 'Communication',
        // Database
        'Database Design', 'Query Optimization', 'Indexing', 'Sharding',
        'Replication', 'Data Modeling', 'NoSQL', 'SQL'
    ];

    techKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
            keywords.push(keyword);
        }
    });

    return [...new Set(keywords)];
};

/**
 * Generate a summary of the CV
 */
const generateSummary = (text) => {
    // Extract first meaningful paragraph or professional summary
    const summaryPattern = /(?:summary|objective|profile|about)[:\s]+(.*?)(?:\n\n|skills|experience)/is;
    const match = text.match(summaryPattern);
    
    if (match && match[1]) {
        return match[1].trim().substring(0, 500);
    }

    // Fallback: use first paragraph
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length > 0) {
        return paragraphs[0].substring(0, 500);
    }

    return 'CV content loaded successfully';
};

/**
 * Main function to process uploaded CV file
 */
export const processCVFile = async (filePath) => {
    try {
        // Extract text
        const cvText = await extractTextFromPDF(filePath);
        
        // Parse content
        const parsedCV = parseCV(cvText);
        
        // Clean up temp file if needed
        if (fs.existsSync(filePath) && filePath.includes('uploads')) {
            // Keep the file for reference
        }

        return {
            success: true,
            data: parsedCV,
            rawText: cvText.substring(0, 2000), // Store first 2000 chars for reference
        };
    } catch (error) {
        console.error('CV processing error:', error);
        throw error;
    }
};

export default {
    extractTextFromPDF,
    parseCV,
    processCVFile,
};

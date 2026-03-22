// backend/services/resumeParser.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import mammoth from 'mammoth';
import fs from 'fs';

/**
 * Extract text from PDF file
 */
const extractPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract PDF content');
    }
};

/**
 * Extract text from DOCX file
 */
const extractDOCX = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        throw new Error('Failed to extract DOCX content');
    }
};

/**
 * Parse resume text and extract structured data
 */
const parseResumeText = (text) => {
    const resumeData = {
        rawText: text,
        skills: [],
        experience: [],
        technologies: [],
        education: [],
        yearsOfExperience: 0
    };

    // Extract skills (common programming languages and technologies)
    const skillPatterns = [
        /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin)\b/gi,
        /\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|\.NET|Laravel)\b/gi,
        /\b(MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|Cassandra|DynamoDB)\b/gi,
        /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|CI\/CD)\b/gi,
        /\b(REST|GraphQL|WebSocket|gRPC|Microservices|API)\b/gi,
        /\b(HTML|CSS|Tailwind|Bootstrap|SASS|SCSS)\b/gi,
        /\b(Redux|MobX|Zustand|Context API|State Management)\b/gi,
        /\b(Jest|Mocha|Pytest|JUnit|Testing|TDD|BDD)\b/gi
    ];

    const skillsSet = new Set();
    skillPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(skill => skillsSet.add(skill));
        }
    });
    resumeData.skills = Array.from(skillsSet);

    // Extract technologies (more specific patterns)
    const techPatterns = [
        /\b(Machine Learning|AI|Deep Learning|NLP|Computer Vision)\b/gi,
        /\b(Blockchain|Web3|Ethereum|Smart Contracts)\b/gi,
        /\b(DevOps|Agile|Scrum|Kanban)\b/gi
    ];

    const techSet = new Set();
    techPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(tech => techSet.add(tech));
        }
    });
    resumeData.technologies = Array.from(techSet);

    // Extract years of experience
    const experiencePatterns = [
        /(\d+)\+?\s*years?\s*of\s*experience/gi,
        /experience\s*:\s*(\d+)\+?\s*years?/gi,
        /(\d+)\+?\s*yrs?\s*exp/gi
    ];

    for (const pattern of experiencePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            resumeData.yearsOfExperience = parseInt(match[1]);
            break;
        }
    }

    // Extract work experience (company names and roles)
    const companyPatterns = [
        /(?:at|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /(?:Software Engineer|Developer|Architect|Manager|Lead|Senior|Junior)\s+at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    const experienceSet = new Set();
    companyPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length > 2) {
                experienceSet.add(match[1]);
            }
        }
    });
    resumeData.experience = Array.from(experienceSet).slice(0, 5); // Limit to 5

    // Extract education
    const educationPatterns = [
        /\b(B\.?S\.?|Bachelor|M\.?S\.?|Master|PhD|Ph\.D\.?)\s+(?:in|of)?\s+([A-Za-z\s]+)/gi,
        /\b(Computer Science|Software Engineering|Information Technology|IT)\b/gi
    ];

    const educationSet = new Set();
    educationPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(edu => educationSet.add(edu));
        }
    });
    resumeData.education = Array.from(educationSet);

    return resumeData;
};

/**
 * Main function to parse resume file
 * @param {string} filePath - Path to the resume file
 * @param {string} fileType - File extension (pdf or docx)
 * @param {boolean} keepFile - Whether to keep the file after parsing (default false)
 * @returns {Promise<Object>} Parsed resume data
 */
export const parseResume = async (filePath, fileType, keepFile = false) => {
    try {
        let text = '';

        if (fileType === 'pdf' || filePath.endsWith('.pdf')) {
            text = await extractPDF(filePath);
        } else if (fileType === 'docx' || filePath.endsWith('.docx')) {
            text = await extractDOCX(filePath);
        } else {
            throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
        }

        const resumeData = parseResumeText(text);

        // Clean up the uploaded file after parsing if not keeping it
        if (!keepFile && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return resumeData;
    } catch (error) {
        // Clean up file on error if not keeping it
        if (!keepFile && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};

/**
 * Generate resume summary for AI context
 */
export const generateResumeSummary = (resumeData) => {
    const parts = [];

    if (resumeData.yearsOfExperience > 0) {
        parts.push(`${resumeData.yearsOfExperience} years of experience`);
    }

    if (resumeData.skills.length > 0) {
        parts.push(`Skills: ${resumeData.skills.join(', ')}`);
    }

    if (resumeData.technologies.length > 0) {
        parts.push(`Technologies: ${resumeData.technologies.join(', ')}`);
    }

    if (resumeData.experience.length > 0) {
        parts.push(`Companies: ${resumeData.experience.join(', ')}`);
    }

    if (resumeData.education.length > 0) {
        parts.push(`Education: ${resumeData.education.join(', ')}`);
    }

    return parts.join('. ');
};

export default { parseResume, generateResumeSummary };

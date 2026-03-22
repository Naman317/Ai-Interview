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
 * Extract skills from CV text
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

    // Common tech stacks to look for
    const commonTechs = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
        'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Git',
        'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Webpack', 'Vite',
        'Testing', 'Jest', 'Unit Testing', 'Integration Testing'
    ];

    const foundTechs = [];
    commonTechs.forEach(tech => {
        if (text.toLowerCase().includes(tech.toLowerCase())) {
            foundTechs.push(tech);
        }
    });

    // Combine and deduplicate
    const allSkills = [...new Set([...skills, ...foundTechs])];
    
    return allSkills.slice(0, 30); // Return top 30 skills
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
 * Extract technical keywords for question personalization
 */
const extractTechnicalKeywords = (text) => {
    const keywords = [];
    
    const techKeywords = [
        'API', 'Database', 'Machine Learning', 'AI', 'DevOps', 'Cloud',
        'Microservices', 'Distributed Systems', 'Real-time', 'Performance',
        'Scalability', 'Security', 'Testing', 'CI/CD', 'Agile', 'Leadership'
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

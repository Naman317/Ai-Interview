import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/QuestionModel.js';

dotenv.config();

console.log('Seeding script started...');
console.log('Current working directory:', process.cwd());

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

const seedProblems = async () => {
    await connectDB();

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        console.error('Data directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    console.log(`Found ${files.length} CSV files.`);

    const questionsMap = new Map();

    for (const file of files) {
        const companyName = file.replace('.csv', '').replace(/-/g, ' ');
        const displayName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

        const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
        const lines = content.split('\n').slice(1); // skip header

        for (const line of lines) {
            if (!line.trim()) continue;
            const parts = splitCSVLine(line);

            if (parts.length < 8) continue;

            const [id, title, url, isPremium, acceptance, difficulty, frequency, topics] = parts;
            const qId = parseInt(id);
            if (isNaN(qId)) continue;

            if (!questionsMap.has(qId)) {
                questionsMap.set(qId, {
                    id: qId,
                    title: title.replace(/"/g, ''),
                    url,
                    isPremium: isPremium.toLowerCase() === 'y',
                    acceptance: parseFloat((acceptance || '0').replace('%', '')),
                    difficulty: difficulty.trim() || 'Medium',
                    frequency: parseFloat((frequency || '0').replace('%', '')),
                    topics: topics.replace(/"/g, '').split(',').map(t => t.trim()).filter(t => t && t !== 'No Topics Found'),
                    companies: [displayName]
                });
            } else {
                const existing = questionsMap.get(qId);
                if (!existing.companies.includes(displayName)) {
                    existing.companies.push(displayName);
                }
            }
        }
    }

    console.log(`Parsed ${questionsMap.size} unique questions. Clearing existing data...`);
    await Question.deleteMany({});

    const questionsArray = Array.from(questionsMap.values());

    // Batch insert in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < questionsArray.length; i += chunkSize) {
        const chunk = questionsArray.slice(i, i + chunkSize);
        await Question.insertMany(chunk);
        console.log(`Inserted ${i + chunk.length} / ${questionsArray.length} questions...`);
    }

    console.log('Seeding completed successfully!');
    process.exit();
};

seedProblems();

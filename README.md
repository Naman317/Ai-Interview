# AI Interviewer

> An intelligent interview preparation platform powered by AI that helps candidates practice technical interviews with personalized questions, real-time code evaluation, and comprehensive feedback.

![Project Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![Python](https://img.shields.io/badge/python-%3E%3D3.8-blue)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

AI Interviewer is a comprehensive platform designed to help software engineers and technical professionals prepare for coding interviews. The platform utilizes artificial intelligence to generate personalized interview questions, evaluate code submissions in real-time, and provide actionable feedback based on performance metrics.

The system supports multiple interview formats, difficulty levels, and company-specific question banks covering 500+ top-tier tech companies. Users can practice with video/audio recording, track progress, and receive detailed performance analytics.

## ✨ Key Features

### Interview Management

- **Personalized Question Generation**: AI-driven question generation based on role, experience level, and resume
- **Multi-Format Support**: Coding, behavioral, and system design interview formats
- **Company-Specific Questions**: Database of questions from 500+ companies including FAANG and startups
- **Question Difficulty Levels**: Beginner, Intermediate, and Advanced difficulty tiers

### Interview Sessions

- **Audio/Video Recording**: Built-in recording capability with Whisper speech-to-text
- **Live Feedback**: Real-time performance metrics and suggestions
- **Session Tracking**: Complete history of all interview attempts
- **Performance Analytics**: Detailed metrics on completion rates and improvement

### User Management

- **Google OAuth Integration**: Seamless authentication
- **Resume Parsing**: Automatic CV analysis for personalization
- **Progress Tracking**: Comprehensive statistics and achievement tracking
- **Performance Dashboard**: Visual analytics of interview performance

## 🛠 Tech Stack

### Frontend

- **Framework**: React 19.2.0 with Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **Charts**: Chart.js with React wrapper
- **Real-time Communication**: Socket.io Client
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Framer Motion animations

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Google OAuth
- **Real-time**: Socket.io
- **File Handling**: Multer for uploads, pdf-parse, mammoth for document conversion
- **Async Handling**: Express-async-handler

### AI Service

- **Framework**: FastAPI
- **Speech Recognition**: OpenAI Whisper
- **video/audio processing**: Cv2, Pydub
- **LLM Models**:
  - Gemini (Google API)
  - Ollama (Local models: Phi, Mistral)
- **Code Execution**: JavaScript VM execution with safety measures

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Client Application (React)              │
│          - Interview Interface                          │
│          - Code Editor & Submission                     │
│          - Real-time Notifications (Socket.io)          │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────────┐  ┌────────▼──────────────┐
│  Backend API        │  │  AI Service (FastAPI)│
│  (Express.js)       │  │  - Question Gen      │
│  - User Auth        │  │  - Code Evaluation   │
│  - Session Mgmt     │  │  - Speech-to-Text    │
│  - Interview Logic  │  │  - Feedback Analysis │
└────────┬────────────┘  └──────────┬───────────┘
         │                          │
         └──────────────┬───────────┘
                        │
              ┌─────────▼────────────┐
              │   MongoDB Database   │
              │  - Users             │
              │  - Sessions          │
              │  - Questions         │
              │  - Feedback          │
              └──────────────────────┘
```

## 📁 Project Structure

```
AI_INTERVIEWER/
├── frontend/                       # React Application
│   ├── src/
│   │   ├── components/            # Reusable React components
│   │   ├── pages/                 # Page components
│   │   ├── redux/                 # Redux slices and store
│   │   ├── services/              # API service calls
│   │   ├── hooks/                 # Custom React hooks
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── backend/                        # Express API Server
│   ├── controllers/               # Route handlers
│   │   ├── userController.js
│   │   ├── interviewController.js
│   │   ├── questionController.js
│   │   ├── sessionController.js
│   │   └── sheetController.js
│   ├── models/                    # MongoDB schemas
│   ├── routes/                    # API routes
│   ├── middleware/                # Express middleware
│   ├── services/                  # Business logic
│   ├── config/                    # Configuration
│   ├── data/                      # Company question datasets (CSV)
│   ├── uploads/                   # File upload directory
│   ├── server.js                  # Entry point
│   └── package.json
│
├── ai-service/                     # FastAPI AI Engine
│   ├── main.py                    # FastAPI app & endpoints
│   ├── code_evaluator.py          # Code evaluation logic
│   ├── visual_analyzer.py         # Performance analysis
│   ├── list_models.py             # Model management
│   ├── requirements.txt
│   └── .env
│
├── output/                         # Generated files & logs
├── test_*.py                       # Test files
└── README.md
```

## 📋 Prerequisites

### System Requirements

- **Node.js**: v16.0.0 or higher
- **Python**: 3.8 or higher
- **MongoDB**: v4.0 or higher (local or cloud instance)
- **Git**: Latest version

### Optional Dependencies

- **Ollama**: For local LLM support (download from [ollama.ai](https://ollama.ai))

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AI_INTERVIEWER.git
cd AI_INTERVIEWER
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai_interviewer

# Authentication
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Service
AI_SERVICE_URL=http://localhost:8000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EOF

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
EOF

# Start development server
npm run dev
```

### 4. AI Service Setup

```bash
cd ../ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
AI_SERVICE_PORT=8000
GEMINI_API_KEY=your_gemini_api_key
OLLAMA_MODEL_NAME=phi
EOF

# Start AI service
python main.py
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

| Variable           | Description               | Example                                    |
| ------------------ | ------------------------- | ------------------------------------------ |
| `PORT`             | Server port               | `5000`                                     |
| `MONGODB_URI`      | MongoDB connection string | `mongodb://localhost:27017/ai_interviewer` |
| `JWT_SECRET`       | JWT signing secret        | `your_secret_key`                          |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID    | `xxx.apps.googleusercontent.com`           |
| `AI_SERVICE_URL`   | AI service endpoint       | `http://localhost:8000`                    |

#### Frontend (.env)

| Variable          | Description     | Example                     |
| ----------------- | --------------- | --------------------------- |
| `VITE_API_URL`    | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket URL   | `http://localhost:5000`     |

#### AI Service (.env)

| Variable            | Description           | Example        |
| ------------------- | --------------------- | -------------- |
| `AI_SERVICE_PORT`   | AI service port       | `8000`         |
| `GEMINI_API_KEY`    | Google Gemini API key | `your_api_key` |
| `OLLAMA_MODEL_NAME` | Model for Ollama      | `phi`          |

## 📖 Usage

### Starting the Development Environment

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Application available at http://localhost:5173
```

**Terminal 3 - AI Service:**

```bash
cd ai-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
# Service running on http://localhost:8000
```

### First Steps

1. Navigate to `http://localhost:5173`
2. Sign up with Google OAuth
3. Upload your resume (optional but recommended for personalization)
4. Select interview role, difficulty, and question count
5. Start interview session
6. Submit code for evaluation
7. Review feedback and analytics

## 🔌 API Documentation

### Authentication Endpoints

- `POST /api/users/auth/google` - Google OAuth authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Interview Endpoints

- `POST /api/interview/start` - Start interview session
- `GET /api/interview/:sessionId` - Get session details
- `POST /api/interview/:sessionId/submit` - Submit answer
- `POST /api/interview/:sessionId/end` - End interview session

### Question Endpoints

- `GET /api/questions` - List all questions (with filters)
- `GET /api/questions/:id` - Get single question
- `POST /api/questions/search` - Search questions

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/resume` - Upload and parse resume
- `GET /api/users/statistics` - Get performance statistics

### Session Endpoints

- `GET /api/sessions` - List user sessions
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - Delete session

## 💾 Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  googleId: String,
  profilePicture: String,
  cvParsed: {
    summary: String,
    skills: [String],
    yearsOfExperience: Number
  },
  completedQuestions: [ObjectId],
  rolePreferences: {
    preferredRoles: [String],
    preferredCompanies: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Session Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  role: String,
  level: String,
  interviewType: String,
  questions: [ObjectId],
  currentQuestionIndex: Number,
  answers: [String],
  recordings: [String],
  feedback: [Object],
  score: Number,
  status: String (ongoing, completed, abandoned),
  startedAt: Date,
  endedAt: Date,
  duration: Number
}
```

### Question Model

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  difficulty: String (Easy, Medium, Hard),
  companies: [String],
  topics: [String],
  category: String,
  frequency: Number,
  examples: [{
    input: String,
    output: String
  }],
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Development

### Building for Production

**Frontend:**

```bash
cd frontend
npm run build
# Output in dist/ directory
```

**Backend:**

```bash
# Simply set NODE_ENV=production and run
NODE_ENV=production npm start
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# AI Service tests
cd ../ai-service
pytest
```

### Code Quality

```bash
# Linting Frontend
cd frontend
npm run lint

# Running ESLint
npx eslint src/
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**

```
Error: ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Ensure MongoDB is running:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Windows
mongod.exe --dbpath "C:\data\db"

# Or use MongoDB Atlas (cloud)
```

**Ollama Not Available**

```
⚠ Ollama package not installed, using Gemini/Mock logic
```

**Solution**: Install Ollama or configure Gemini API key in `.env`

**Port Already in Use**

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Change port in `.env` or kill process:

```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**CORS Errors**
**Solution**: Ensure allowed origins in `backend/server.js` match your frontend URL:

```javascript
const allowedOrigin = [
  "http://localhost:5173", // Vite default
  "http://localhost:3000", // Your frontend port
];
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Built with modern full-stack technologies
- Companies data sourced from LeetCode and InterviewBit
- AI models powered by OpenAI (Whisper), Google (Gemini), and Ollama
- Open-source community for amazing libraries and tools

---

<div align="center">
  Made with ❤️ by the AI Interviewer Team
</div>

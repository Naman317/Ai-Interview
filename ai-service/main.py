import uvicorn
import os
import io
import json
import tempfile
from fastapi import FastAPI,HTTPException,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import whisper

# Try to import ollama and check if service is available
OLLAMA_AVAILABLE = False
try:
    import ollama
    # Assume Ollama is available if package is installed
    # The actual service check happens at endpoint call time
    OLLAMA_AVAILABLE = True
    print("✓ Ollama package imported successfully")
except ImportError:
    OLLAMA_AVAILABLE = False
    ollama = None
    print("⚠ Ollama package not installed, using mock questions")

try:
    from pydub import AudioSegment
except (ImportError, ModuleNotFoundError):
    AudioSegment = None
    # No warning - fallback to direct audio processing is automatic

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT",8000))
OLLAMA_MODEL_NAME=os.getenv("OLLAMA_MODEL_NAME","mistral")  # Upgraded from 'phi' to 'mistral' for better quality

app=FastAPI(title="AI Interviewer Microservice",version="1.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WHISPER_MODEL=None

try:
    print("Loading Whisper Model ...")
    WHISPER_MODEL=whisper.load_model("base.en")
    print("Whisper Model Loaded Successfully")
except Exception as e:
    print("Error while loading Whisper Model")
    print(e)

class QuestionResquest(BaseModel):
    role:str="MERN Stack Developer"
    level:str="Junior"
    count:int=5
    interview_type:str="coding-mix"
    resume_context:Optional[str]=None
    resume_skills:Optional[list[str]]=None
    resume_experience_years:Optional[int]=None


class QuestionResponse(BaseModel):
    questions:list[str]
    model_used:str

class EvaluationRequest(BaseModel):
    question:str
    question_type:str
    role:str
    level:str
    user_answer:Optional[str]=None
    user_code:Optional[str]=None

class EvaluationResponse(BaseModel):
    technicalScore:int
    confidenceScore:int
    aiFeedback:str
    idealAnswer:str

class GuideRequest(BaseModel):
    title: str
    description: str
    difficulty: str
    tags: list[str] = []

class GuideResponse(BaseModel):
    approach: str
    verbalization: str
    complexityAnalysis: dict

class ProblemRequest(BaseModel):
    title: str
    company: str

class ProblemResponse(BaseModel):
    description: str
    examples: list[dict]
    testCases: list[dict]
    constraints: list[str]

# Mock data for when Ollama is not available - NOW WITH REALISTIC INTERVIEW QUESTIONS
MOCK_QUESTIONS = {
    "MERN Stack Developer": {
        "Junior": [
            "Tell me about a project where you built a React component. How did you structure it and what challenges did you face?",
            "Explain the difference between state and props in React. Can you give a real example from your projects?",
            "What's your experience with Node.js backend development? Walk me through how you built an API endpoint.",
            "How do you handle asynchronous operations in JavaScript? Give me an example from your work.",
            "Describe your experience with MongoDB. How would you design a data schema for a blog application?"
        ],
        "Mid-Level": [
            "Tell me about a time when you had to optimize a React component's performance. What tools did you use and what was the outcome?",
            "How would you design a system to handle real-time notifications using Node.js and WebSockets? What trade-offs would you consider?",
            "Describe your approach to error handling in a full-stack application. Walk through your strategy from frontend to database.",
            "Have you dealt with database indexing or query optimization in MongoDB? Tell me about a specific scenario.",
            "How do you approach testing in a MERN stack? What's your experience with unit, integration, and end-to-end testing?",
            "What's the most complex feature you've built with React? How did you manage state?",
            "Explain how you would implement authentication in a MERN app. What security considerations matter most?"
        ],
        "Senior": [
            "Design a real-time collaborative document editor using MERN stack. How would you handle concurrent users editing the same document?",
            "Tell me about an architectural decision you made that you later regretted. What would you do differently?",
            "How would you scale a MERN application to handle millions of concurrent users? Walk me through your approach.",
            "Describe your experience with microservices. How have you transitioned from monolithic to microservice architecture?",
            "What's your approach to database schema evolution and migrations in a production system?",
            "Tell me about a time you had to mentor a junior developer on React best practices. What was most important to teach them?",
            "How do you approach technical debt? When do you decide it's time to refactor vs. moving forward with new features?",
            "Describe your experience with deployment and CI/CD pipelines. How do you ensure reliability in production?"
        ]
    },
    "Frontend Developer": {
        "Junior": [
            "Tell me about the last website you built. What was the most challenging part of implementing the UI?",
            "How do you approach responsive design? Walk me through your process for making sites work on mobile, tablet, and desktop.",
            "What's your experience with CSS? Can you explain how flexbox or grid works?",
            "Describe a time when you debugged a tricky frontend issue. What was the problem and how did you solve it?",
            "What's your understanding of the DOM? How would you manipulate it with JavaScript?"
        ],
        "Mid-Level": [
            "Tell me about your experience with modern frontend frameworks. Why did you choose the ones you work with?",
            "How do you approach performance optimization in frontend applications? What metrics do you care about?",
            "Describe the most complex component you've built. How did you handle state management and prop drilling?",
            "What's your experience with accessibility (a11y)? How do you ensure your UIs are accessible?",
            "Tell me about your approach to testing frontend code. What tools do you prefer and why?"
        ],
        "Senior": [
            "Design a design system from scratch. How would you structure components and ensure consistency across products?",
            "Tell me about your experience at scale. How have you optimized performance when dealing with millions of users?",
            "How do you approach technical leadership on a frontend team? Describe your mentoring philosophy.",
            "What's your vision for the future of frontend development? What technologies excite you?",
            "Describe a complex feature you built that required cross-team coordination. How did you manage stakeholder expectations?"
        ]
    },
    "Full Stack Developer": {
        "Junior": [
            "Walk me through the last full-stack project you built, from frontend to database. What was your architecture?",
            "How do you approach debugging issues in a full-stack application? What's your process?",
            "Tell me about your experience with databases. How would you design a schema for an e-commerce site?",
            "Describe how you built an API. What did you consider for performance and security?",
            "What tools do you use for version control and deployment? Walk me through your workflow."
        ],
        "Mid-Level": [
            "Tell me about a production incident you dealt with. How did you diagnose and fix it?",
            "How do you approach API design? What makes a good REST API?",
            "Describe your experience with database optimization. When would you use caching vs. query optimization?",
            "Tell me about your approach to security in a full-stack application. What are your biggest concerns?",
            "How do you balance technical debt with shipping new features? Give me a real example."
        ],
        "Senior": [
            "Design a system that processes millions of requests per day. Walk me through your architecture decisions.",
            "Tell me about your philosophy on system design. What principles guide your architectural decisions?",
            "How do you handle scaling challenges? Describe a complex scaling problem you've solved.",
            "What's your approach to building teams and mentoring engineers? How do you foster a strong engineering culture?",
            "Tell me about a time you simplified a complex system. What was the impact?"
        ]
    },
    "DevOps Engineer": {
        "Junior": [
            "Tell me about your experience with Docker and containerization. Walk me through how you'd containerize an application.",
            "What's your experience with CI/CD pipelines? Describe a pipeline you've built or worked with.",
            "How do you approach infrastructure as code? What tools have you used?",
            "Tell me about your experience with cloud platforms. Which one do you know best and why?",
            "Describe how you'd troubleshoot a failing deployment. What's your process?"
        ],
        "Mid-Level": [
            "Design a CI/CD pipeline for a microservices application with thousands of deployments per day.",
            "Tell me about monitoring and logging in your systems. How do you ensure visibility into production?",
            "Describe your approach to disaster recovery and high availability. What RTO/RPO targets do you typically aim for?",
            "How do you handle infrastructure scaling? Tell me about a time you had to scale rapidly.",
            "What's your experience with Kubernetes? How do you manage resource allocation and orchestration?"
        ],
        "Senior": [
            "Design a cloud infrastructure for a startup expecting to grow 10x in the next year. What decisions would you make?",
            "Tell me about your experience with security in DevOps. How do you balance security and development velocity?",
            "Describe your approach to cost optimization in the cloud. What strategies have you used?",
            "How do you build DevOps culture in an organization? Tell me about your approach to empowering teams.",
            "What's your vision for the future of infrastructure? How would you prepare for emerging technologies?"
        ]
    }
}

@app.get("/")
async def root():
    return {"message":"Hello from AI Interviewer Microservice !","model":OLLAMA_MODEL_NAME}


@app.post("/generate-questions",response_model=QuestionResponse)
async def generate_questions(request:QuestionResquest):
    try:
        # If Ollama is not available, use mock questions
        if not OLLAMA_AVAILABLE:
            role = request.role if request.role in MOCK_QUESTIONS else "MERN Stack Developer"
            level = request.level if request.level in MOCK_QUESTIONS.get(role, {}) else "Junior"
            questions = MOCK_QUESTIONS.get(role, {}).get(level, [])[:request.count]
            return QuestionResponse(questions=questions, model_used="mock-questions")
        
        if request.interview_type=="video":
            interview_focus=(
                "behavioral_and_communication"
            )
            interview_instruction=(
                "Videos allow assessment of communication skills, presence, and authenticity. "
                "Mix behavioral questions (STAR method answers) with technical questions. "
                "Include questions that reveal how they communicate under pressure."
                " Sometime Mix algorithmic problems with system design conceptual questions. "
                "Include questions about edge cases and optimization."
                "Include follow-up questions that probe deeper into their knowledge."
            )
        elif request.interview_type=="voice":
            interview_focus=(
                "technical_and_behavioral"
            )
            interview_instruction=(
                "Voice interviews focus on technical depth and problem-solving communication. "
                "Ask progressively harder technical questions. "
                " Sometime Mix algorithmic problems with system design conceptual questions. "
                "Include questions about edge cases and optimization."
                "Include follow-up questions that probe deeper into their knowledge."
            )
        else:
            interview_focus=(
                "coding_and_technical"
            )
            interview_instruction=(
                "Coding interviews assess algorithm knowledge, problem-solving approach, and code quality. "
                "Mix algorithmic problems with system design conceptual questions. "
                "Include questions about edge cases and optimization."
            )

        # Build resume-aware context
        resume_context = ""
        resume_context_line = ""
        if request.resume_context:
            resume_context += f"Candidate Background: {request.resume_context}\n"
            resume_context_line += resume_context
        if request.resume_skills:
            top_skills = request.resume_skills[:8]
            resume_context += f"Key Skills: {', '.join(top_skills)}\n"
            resume_context_line += f"Key Skills: {', '.join(top_skills)}\n"
        if request.resume_experience_years:
            experience_text = f"{request.resume_experience_years} years of experience"
            resume_context += f"Experience Level: {experience_text}\n"
            resume_context_line += f"Experience Level: {experience_text}\n"
        
        # Generate experience-level specific guidance
        if request.level.lower() == "junior":
            difficulty_instruction = (
                "DIFFICULTY LEVEL - JUNIOR:\n"
                "- Ask foundational and practical questions\n"
                "- Include 'real project' scenarios to understand their experience with actual code\n"
                "- Ask about specific tech stacks they list on resume\n"
                "- Include 1-2 coding fundamentals questions\n"
                "- Assess learning ability and growth mindset"
            )
        elif request.level.lower() == "mid-level" or request.level.lower() == "mid level":
            difficulty_instruction = (
                "DIFFICULTY LEVEL - MID-LEVEL:\n"
                "- Mix foundational + advanced technical questions\n"
                "- Ask about architectural decisions they've made\n"
                "- Include system design concepts (scaling, caching, databases)\n"
                "- Ask about trade-offs and optimization strategies\n"
                "- Assess leadership skills and mentoring ability"
            )
        else:  # Senior
            difficulty_instruction = (
                "DIFFICULTY LEVEL - SENIOR:\n"
                "- Focus on complex system design and architectural decisions\n"
                "- Ask about past challenges and how they handled technical debt\n"
                "- Questions about scaling systems to millions of users\n"
                "- Leadership, mentoring, and technical strategy questions\n"
                "- Industry trends and forward-thinking questions\n"
                "- Assess judgment, experience, and strategic thinking"
            )

        system_prompt=(
            "You are an experienced technical interviewer for a top-tier tech company. "
            "Your goal: Generate interview questions that feel REAL and like what actual interviewers would ask. "
            f"\n{interview_instruction}\n"
            f"\n{difficulty_instruction}\n"
            f"\nQUESTION GENERATION GUIDELINES:\n"
            "1. Questions should sound natural - as if spoken by a human interviewer\n"
            "2. Avoid generic questions - be specific to the role and their background\n"
            "3. Mix question types:\n"
            "   - Behavioral: 'Tell me about a time when...', 'How do you...', 'Describe your experience with...'\n"
            "   - Technical: Problem-solving, architecture, specific technology questions\n"
            "   - Situational: 'How would you handle...', 'What if...'\n"
            "   - Real Project: Ask about specific projects from their resume\n"
            "4. Progress from easier to harder questions naturally\n"
            "5. Include follow-up style questions that show interviewer engagement\n"
            "6. Ask questions that reveal problem-solving process, not just answers\n"
            "\nQUESTION QUALITY STANDARDS:\n"
            "- Each question should be open-ended and thought-provoking\n"
            "- Questions should encourage detailed answers (2-5 minute responses)\n"
            "- Avoid yes/no questions\n"
            "- Make questions specific enough to assess real skills\n"
            "- Include depth - questions that can't be answered from Google\n"
            f"\nRESUME CONTEXT:\n{resume_context_line}"
            "IMPORTANT: Personalize questions based on their resume. If they mention React, ask about React specifically. "
            "If they have 5+ years experience, ask senior-level questions.\n"
            "\nOUTPUT FORMAT:\n"
            "1. Output EXACTLY ONE question per line\n"
            "2. NO numbering, NO explanations, NO extra text\n"
            "3. Each question is complete and ready to ask\n"
            "4. Questions feel natural and conversational"
        )

        user_prompt=(
            f"Generate exactly {request.count} interview questions for a {request.level} level {request.role}.\n"
            f"\nThese questions should:\n"
            f"- Feel like a real interview (natural, conversational, engaging)\n"
            f"- Assess both technical ability and soft skills\n"
            f"- Progress from easier to more challenging\n"
            f"- Be specific to {request.role} role\n"
            f"- Be appropriate for {'video interview' if request.interview_type == 'video' else 'technical interview'}\n"
            f"\nFormat: One question per line, no numbering. Ready to ask a candidate."
        )
        try:
            response=ollama.generate(
                model=OLLAMA_MODEL_NAME,
                prompt=user_prompt,
                system=system_prompt,
                stream=False,
                options={"temperature":0.7, "top_p":0.9, "top_k":40}
            )
        except Exception as e:
            # If Ollama fails, fall back to mock questions
            print(f"Ollama generation failed: {e}")
            role = request.role if request.role in MOCK_QUESTIONS else "MERN Stack Developer"
            level = request.level if request.level in MOCK_QUESTIONS.get(role, {}) else "Junior"
            questions = MOCK_QUESTIONS.get(role, {}).get(level, [])[:request.count]
            return QuestionResponse(questions=questions, model_used="mock-questions")

        raw_text=response['response'].strip()
        questions=[q.strip() for q in raw_text.split('\n') if q.strip()]
        return QuestionResponse(questions=questions[:request.count],model_used=OLLAMA_MODEL_NAME)

    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
    

@app.post("/transcribe")
async def transcribe_audio(audioFile:UploadFile=File(...)):
    temp_audio_path = None
    try:
        if not WHISPER_MODEL:
            raise HTTPException(status_code=503,detail="Whisper Model is not loaded")
        
        audio_bytes=await audioFile.read()
        
        # Try to use pydub if available for audio conversion
        if AudioSegment:
            try:
                audio_in_memory=io.BytesIO(audio_bytes)
                audio_segment=AudioSegment.from_file(audio_in_memory)
                with tempfile.NamedTemporaryFile(delete=False,suffix=".wav") as tmp:
                    temp_audio_path=tmp.name
                    audio_segment.export(temp_audio_path,format="wav")
            except Exception as e:
                print(f"pydub conversion failed: {e}, using direct transcription")
                # Fall back to direct transcription with temp file
                with tempfile.NamedTemporaryFile(delete=False,suffix=".wav") as tmp:
                    temp_audio_path=tmp.name
                    tmp.write(audio_bytes)
                    tmp.flush()
        else:
            # pydub not available, save directly
            with tempfile.NamedTemporaryFile(delete=False,suffix=".wav") as tmp:
                temp_audio_path=tmp.name
                tmp.write(audio_bytes)
                tmp.flush()
        
        result=WHISPER_MODEL.transcribe(temp_audio_path)
        return {"transcription":result["text"].strip()}

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500,detail=str(e))
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass

@app.post("/evaluate",response_model=EvaluationResponse)
async def evaluate(request:EvaluationRequest):
    try:
        # If Ollama is not available, return mock evaluation
        if not OLLAMA_AVAILABLE:
            # Generate a mock evaluation based on answer length and content
            answer_text = (request.user_answer or "") + (request.user_code or "")
            if not answer_text.strip():
                return EvaluationResponse(
                    technicalScore=0,
                    confidenceScore=0,
                    aiFeedback="No answer provided. Please provide a verbal or code response.",
                    idealAnswer="A complete answer should be provided addressing the question."
                )
            else:
                return EvaluationResponse(
                    technicalScore=65,
                    confidenceScore=70,
                    aiFeedback="Good attempt at answering the question. Try to provide more specific examples and edge case handling.",
                    idealAnswer="The ideal answer would include clear explanation of the concept, relevant examples, and consideration of edge cases."
                )
        
        if request.question_type=="oral":
            assessment_instruction=(
                "ORAL/BEHAVIORAL QUESTION EVALUATION:\n"
                "Assess the quality of their explanation, clarity of thought, and depth of knowledge.\n"
                "Look for: clear communication, specific examples, demonstrates thinking process, addresses multiple aspects of question.\n"
                "Red flags: vague answers, no examples, doesn't answer the actual question asked, hesitation/uncertainty.\n"
                "Excellent: Can clearly explain complex concepts, provides real project examples, shows critical thinking."
            )
        else:
            assessment_instruction=(
                "TECHNICAL/CODING QUESTION EVALUATION:\n"
                "Assess the correctness of approach/code, efficiency, code quality, and problem-solving methodology.\n"
                "Look for: correct solution, considers edge cases, clean code, explains trade-offs, optimizes when needed.\n"
                "Red flags: doesn't compile/run, major logical flaws, no consideration of efficiency, poor code structure.\n"
                "Excellent: Correct solution, optimal or near-optimal, clean implementation, explains reasoning."
            )
        
        system_prompt=(
            "You are an experienced technical interviewer conducting a real interview. "
            "Your job: Fairly evaluate a candidate's response based on what a real company would expect.\n\n"
            "EVALUATION CRITERIA:\n"
            "Technical Score (0-100): How well they answered - correctness, completeness, depth\n"
            "  - 90-100: Expert level, production-ready solution\n"
            "  - 80-89: Very good, minor improvements\n"
            "  - 70-79: Solid understanding, could use improvement\n"
            "  - 60-69: Acceptable for their level, but gaps exist\n"
            "  - 50-59: Below expectations, significant issues\n"
            "  - Below 50: Major problems, doesn't meet basic requirements\n\n"
            "Confidence Score (0-100): How confident and communicative they were\n"
            "  - How clearly they explained their thinking\n"
            "  - Whether they seemed confident or uncertain\n"
            "  - Communication quality and professionalism\n\n"
            f"{assessment_instruction}\n\n"
            "IMPORTANT: Give feedback as a real interviewer would:\n"
            "- Be specific about what was good and what needs improvement\n"
            "- Be fair and calibrated to their experience level\n"
            "- Highlight patterns, not just isolated issues\n"
            "- Provide constructive and actionable feedback\n\n"
            "Output ONLY valid JSON (no markdown, no extra text)."
        )
        
        user_prompt=(
            f"Evaluate this interview response:\n\n"
            f"CONTEXT:\n"
            f"  Role: {request.role}\n"
            f"  Level: {request.level}\n"
            f"  Question Type: {request.question_type}\n\n"
            f"QUESTION ASKED:\n"
            f"  {request.question}\n\n"
            f"CANDIDATE'S RESPONSE:\n"
            f"  Verbal Answer: {request.user_answer or '(No verbal answer)'}\n"
            f"  Code/Solution: {request.user_code or '(No code provided)'}\n\n"
            f"Provide your evaluation as a fair interviewer would.\n"
            f"Return only JSON with: technicalScore, confidenceScore, aiFeedback, idealAnswer"
        )
        try:
            response=ollama.generate(
                model=OLLAMA_MODEL_NAME,
                prompt=user_prompt,
                system=system_prompt,
                format="json",
                stream=False,
                options={"temperature":0.2, "top_p":0.85}
            )
        except Exception as e:
            # If Ollama fails, return mock evaluation
            print(f"Ollama evaluation failed: {e}")
            answer_text = (request.user_answer or "") + (request.user_code or "")
            if not answer_text.strip():
                return EvaluationResponse(
                    technicalScore=0,
                    confidenceScore=0,
                    aiFeedback="No answer provided. Please provide a verbal or code response.",
                    idealAnswer="A complete answer should be provided addressing the question."
                )
            else:
                return EvaluationResponse(
                    technicalScore=65,
                    confidenceScore=70,
                    aiFeedback="Good attempt at answering the question. Try to provide more specific examples and edge case handling.",
                    idealAnswer="The ideal answer would include clear explanation of the concept, relevant examples, and consideration of edge cases."
                )
        response_text=response['response'].strip()
        try:
            evaluation_data=json.loads(response_text)
            # Clean and validate aiFeedback
            if 'aiFeedback' in evaluation_data:
                feedback = evaluation_data['aiFeedback']
                if isinstance(feedback, dict):
                    # If it's an empty dict, use default feedback
                    if not feedback:
                        evaluation_data['aiFeedback'] = "Your answer was not adequately detailed. Please provide more specific examples and explanations."
                    else:
                        evaluation_data['aiFeedback'] = json.dumps(feedback)
                elif isinstance(feedback, str) and not feedback.strip():
                    evaluation_data['aiFeedback'] = "Your answer was not adequately detailed. Please provide more specific examples and explanations."
                else:
                    evaluation_data['aiFeedback'] = str(feedback)
            # Clean and validate idealAnswer
            if 'idealAnswer' in evaluation_data:
                answer = evaluation_data['idealAnswer']
                if isinstance(answer, dict):
                    if not answer:
                        evaluation_data['idealAnswer'] = "A comprehensive answer should address all aspects of the question with examples and edge case considerations."
                    else:
                        evaluation_data['idealAnswer'] = json.dumps(answer)
                elif isinstance(answer, str) and not answer.strip():
                    evaluation_data['idealAnswer'] = "A comprehensive answer should address all aspects of the question with examples and edge case considerations."
                else:
                    evaluation_data['idealAnswer'] = str(answer)
            return EvaluationResponse(**evaluation_data)
        except json.JSONDecodeError:
            import re
            fixed_text=re.sub(r'[\r\n\t]',' ',response_text)
            try:
                evaluation_data=json.loads(fixed_text)
                # Clean and validate aiFeedback
                if 'aiFeedback' in evaluation_data:
                    feedback = evaluation_data['aiFeedback']
                    if isinstance(feedback, dict):
                        if not feedback:
                            evaluation_data['aiFeedback'] = "Your answer was not adequately detailed. Please provide more specific examples and explanations."
                        else:
                            evaluation_data['aiFeedback'] = json.dumps(feedback)
                    elif isinstance(feedback, str) and not feedback.strip():
                        evaluation_data['aiFeedback'] = "Your answer was not adequately detailed. Please provide more specific examples and explanations."
                    else:
                        evaluation_data['aiFeedback'] = str(feedback)
                # Clean and validate idealAnswer
                if 'idealAnswer' in evaluation_data:
                    answer = evaluation_data['idealAnswer']
                    if isinstance(answer, dict):
                        if not answer:
                            evaluation_data['idealAnswer'] = "A comprehensive answer should address all aspects of the question with examples and edge case considerations."
                        else:
                            evaluation_data['idealAnswer'] = json.dumps(answer)
                    elif isinstance(answer, str) and not answer.strip():
                        evaluation_data['idealAnswer'] = "A comprehensive answer should address all aspects of the question with examples and edge case considerations."
                    else:
                        evaluation_data['idealAnswer'] = str(answer)
                return EvaluationResponse(**evaluation_data)
            except Exception as parse_error:
                print(f"Failed to parse evaluation response: {parse_error}. Raw: {response_text[:200]}")
                return EvaluationResponse(
                    technicalScore=0,
                    confidenceScore=0,
                    aiFeedback="Your submission could not be properly evaluated. Please ensure you provided a complete answer.",
                    idealAnswer="A comprehensive answer should address all aspects of the question with concrete examples."
                )

    except Exception as e:
        print(f"Failed to generate response: {e}")
        raise HTTPException(status_code=500,detail=str(e))

# Video Analysis Models
from fastapi import Form
class VideoAnalysisResponse(BaseModel):
    transcript: str
    eyeContact: int
    confidence: int
    fluency: int
    clarity: int
    technicalScore: int
    feedback: str

@app.post("/analyze-video", response_model=VideoAnalysisResponse)
async def analyze_video(
    video: UploadFile = File(...),
    question: str = Form(...),
    role: str = Form(...),
    level: str = Form(...),
    duration: int = Form(...)
):
    try:
        # If Whisper is not available, return mock analysis
        if not WHISPER_MODEL:
            return VideoAnalysisResponse(
                transcript="[Audio transcription unavailable]",
                eyeContact=75,
                confidence=80,
                fluency=78,
                clarity=82,
                technicalScore=75,
                feedback="Good presentation. Consider providing more specific examples and technical details."
            )

        # Save video temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_video:
            temp_video.write(await video.read())
            video_path = temp_video.name

        # 1. Visual Analysis (MediaPipe + FER)
        visual_results = None
        try:
            from visual_analyzer import VisualAnalyzer
            visual_analyzer = VisualAnalyzer()
            visual_results = visual_analyzer.analyze_video(video_path)
            print(f"✓ Visual analysis successful: {visual_results}")
        except Exception as e:
            print(f"⚠ Visual analysis failed: {e}")

        # 2. Extract audio using FFmpeg
        audio_path = video_path.replace('.webm', '.wav')
        try:
            import subprocess
            subprocess.run([
                'ffmpeg', '-i', video_path, 
                '-vn', '-acodec', 'pcm_s16le', 
                '-ar', '16000', '-ac', '1', 
                audio_path
            ], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"FFmpeg failed or not found: {e}")
            # If FFmpeg fails, try to transcribe video directly
            audio_path = video_path

        # 3. Transcribe with Whisper
        try:
            result = WHISPER_MODEL.transcribe(audio_path)
            transcript = result['text'].strip()
            
            # Heuristic scores based on transcription result
            word_count = len(transcript.split())
            duration_num = int(duration) or 1
            speaking_rate = word_count / (duration_num / 60) # words per minute
            
            # Fluency based on speaking rate (Normal is 130-160 wpm)
            fluency_score = min(100, max(50, int((speaking_rate / 150) * 85)))
            
            # Clarity based on average logprob from segments
            clarity_score = 80 # Default
            if result.get('segments'):
                avg_logprob = sum(s.get('avg_logprob', 0) for s in result['segments']) / len(result['segments'])
                clarity_score = min(100, max(40, int((1 + avg_logprob) * 100)))

        except Exception as e:
            print(f"Whisper transcription failed: {e}")
            transcript = "[Transcription failed]"
            fluency_score = 70
            clarity_score = 70

        # Clean up temp files
        try:
            os.unlink(video_path)
            if audio_path != video_path:
                os.unlink(audio_path)
        except:
            pass

        # If transcript is empty or too short
        if not transcript or len(transcript) < 10:
            return VideoAnalysisResponse(
                transcript=transcript or "[No speech detected]",
                eyeContact=visual_results.get("eyeContact", 60) if visual_results else 60,
                confidence=40,
                fluency=40,
                clarity=40,
                technicalScore=30,
                feedback="Unable to detect clear speech. Please ensure your microphone is working and speak clearly."
            )

        # 4. Analyze content with Ollama
        confidence_base = 80
        technical_score = 75
        ai_feedback = "Good response."
        
        if OLLAMA_AVAILABLE:
            try:
                system_prompt = (
                    "You are an expert technical interviewer. Analyze the provided transcript of an interview answer. "
                    "Rate technical accuracy and provide constructive feedback. "
                    "Respond ONLY with a JSON object. "
                    "Required keys: 'technicalScore' (0-100), 'aiFeedback' (string). "
                )

                user_prompt = (
                    f"Role: {role}\n"
                    f"Level: {level}\n"
                    f"Question: {question}\n"
                    f"Transcript: {transcript}\n"
                )

                response = ollama.generate(
                    model=OLLAMA_MODEL_NAME,
                    prompt=user_prompt,
                    system=system_prompt,
                    format="json",
                    options={"temperature": 0.1}
                )
                
                analysis_data = json.loads(response['response'].strip())
                technical_score = analysis_data.get('technicalScore', 75)
                ai_feedback = analysis_data.get('aiFeedback', ai_feedback)
            except Exception as e:
                print(f"Ollama analysis failed: {e}")

        # Combine Audio + Visual results
        eye_contact = visual_results.get("eyeContact", 75) if visual_results else 75
        
        # Confidence is a mix of voice fluency and visual positivity
        visual_boost = visual_results.get("confidence_boost", 0) if visual_results else 0
        final_confidence = min(100, max(50, fluency_score + visual_boost))
        
        # Combine feedback
        visual_note = visual_results.get("visual_feedback", "") if visual_results else ""
        final_feedback = f"{ai_feedback} {visual_note}".strip()

        return VideoAnalysisResponse(
            transcript=transcript,
            eyeContact=eye_contact,
            confidence=final_confidence,
            fluency=fluency_score,
            clarity=clarity_score,
            technicalScore=technical_score,
            feedback=final_feedback
        )

    except Exception as e:
        print(f"Analysis endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def random_score(min_val, max_val):
    import random
    return random.randint(min_val, max_val)

        

@app.post("/generate-guide", response_model=GuideResponse)
async def generate_guide(request: GuideRequest):
    try:
        # Mock guide if Ollama is not available
        if not OLLAMA_AVAILABLE:
            return GuideResponse(
                approach="1. Understand the problem constraints.\n2. Use a hash map for O(n) lookups.\n3. Iterate once through the array.",
                verbalization="I'll first initialize a hash map to store seen values and their indices. As I iterate through the array, I'll calculate the complement needed for the target sum...",
                complexityAnalysis={"time": "O(N)", "space": "O(N)"}
            )

        prompt = f"""
        Act as a Senior Software Engineer. Provide an interview strategy guide for the following coding problem:
        Title: {request.title}
        Description: {request.description}
        Difficulty: {request.difficulty}
        Tags: {', '.join(request.tags)}

        Return a JSON object with:
        1. 'approach': A 3-step conceptual breakdown of the logic.
        2. 'verbalization': A script on how the candidate should explain this out loud to an interviewer.
        3. 'complexityAnalysis': {{'time': 'Big O Time', 'space': 'Big O Space'}}

        Return ONLY the JSON.
        """

        response = ollama.generate(model=OLLAMA_MODEL_NAME, prompt=prompt)
        content = response['response']
        
        # Clean up JSON if LLM adds markdown
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        data = json.loads(content)
        return GuideResponse(
            approach=data.get('approach', "Logic breakdown pending."),
            verbalization=data.get('verbalization', "Explanation script pending."),
            complexityAnalysis=data.get('complexityAnalysis', {"time": "O(N)", "space": "O(1)"})
        )
    except Exception as e:
        print(f"Guide generation failed: {e}")
        return GuideResponse(
            approach="Standard algorithmic approach applies.",
            verbalization="I will explain the step-by-step logic starting from the brute force and then optimizing for time complexity.",
            complexityAnalysis={"time": "O(N)", "space": "O(1)"}
        )

@app.post("/generate-problem", response_model=ProblemResponse)
async def generate_problem(request: ProblemRequest):
    try:
        if not OLLAMA_AVAILABLE:
            return ProblemResponse(
                description=f"Detailed description for {request.title}. This problem is frequently asked at {request.company}.",
                examples=[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."}],
                testCases=[{"input": "[2,7,11,15]\n9", "expectedOutput": "[0,1]"}],
                constraints=["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"]
            )

        prompt = f"""
        Generate a coding problem description and data for:
        Title: {request.title}
        Company Context: {request.company}

        Return a JSON object with:
        1. 'description': detailed problem statement.
        2. 'examples': list of {{"input": "...", "output": "...", "explanation": "..."}}
        3. 'testCases': list of {{"input": "...", "expectedOutput": "..."}}
        4. 'constraints': list of strings.

        Format 'testCases' input as a single string.
        Return ONLY the JSON. No other text.
        """

        response = ollama.generate(model=OLLAMA_MODEL_NAME, prompt=prompt)
        content = response['response']
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        data = json.loads(content)
        return ProblemResponse(
            description=data.get('description', f"Solve {request.title}"),
            examples=data.get('examples', []),
            testCases=data.get('testCases', []),
            constraints=data.get('constraints', [])
        )
    except Exception as e:
        print(f"Problem generation failed: {e}")
        return ProblemResponse(
            description=f"Failed to generate details for {request.title}. Please try again.",
            examples=[],
            testCases=[],
            constraints=[]
        )

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=AI_SERVICE_PORT)
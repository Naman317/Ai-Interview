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

# Mock data for when Ollama is not available
MOCK_QUESTIONS = {
    "MERN Stack Developer": {
        "Junior": [
            "Explain the difference between var, let, and const in JavaScript",
            "What is the purpose of useEffect hook in React?",
            "How does MongoDB store data compared to relational databases?",
            "Write a function to find the largest number in an array",
            "What is middleware in Express.js and how does it work?"
        ],
        "Mid-Level": [
            "Explain how React's Virtual DOM works",
            "Design a caching strategy for a MongoDB application",
            "Write a function to debounce API calls",
            "How would you handle authentication in a MERN stack application?",
            "Explain the concept of closures in JavaScript"
        ],
        "Senior": [
            "Design a scalable microservices architecture using Node.js",
            "How would you optimize database queries in MongoDB for a large dataset?",
            "Implement a custom React hook for complex state management",
            "What strategies would you use for deploying a MERN application?",
            "Explain how to implement real-time features using WebSockets"
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
            intruction=(
                "Generate ONLY behavioral and communication-focused questions for video interviews. "
                "Include questions about background, motivations, challenges faced, interpersonal skills, and problem-solving approach. "
                "Keep questions professional but conversational."
            )
        elif request.interview_type=="voice":
            intruction=(
                "Generate ONLY conceptual and behavioral questions for voice interviews. "
                "Include questions about technical knowledge, experience, problem-solving, teamwork, and career goals. "
                "Mix both technical and soft skills questions appropriately."
            )
        else:
            intruction="Generate interview questions appropriate for technical interviews."

        # Build resume-aware context
        resume_context = ""
        if request.resume_context:
            resume_context = f"\nCandidate Background: {request.resume_context}"
            if request.resume_skills:
                resume_context += f"\nKey Skills: {', '.join(request.resume_skills[:10])}"
            if request.resume_experience_years:
                resume_context += f"\nYears of Experience: {request.resume_experience_years}"
            resume_context += "\nIMPORTANT: Generate questions that are personalized based on the candidate's background and skills. Ask about specific technologies they know and their experience level."

        system_prompt=(
            "You are a professional technical interviewer with expertise in evaluating candidates. "
            "Your task: Generate diverse, role-appropriate interview questions that assess both technical and soft skills. "
            f"Interview Type: {intruction} "
            "CRITICAL RULES:\n"
            "1. Output EXACTLY ONE question per line\n"
            "2. NO numbering, NO explanations, NO extra text\n"
            "3. Each question should be unique and progressively deeper\n"
            "4. Use open-ended questions that reveal problem-solving ability\n"
            f"{resume_context}"
        )

        user_prompt=(
            f"Generate exactly {request.count} unique, challenging interview questions for:\n"
            f"Role: {request.level} level {request.role}\n"
            f"Format: One question per line. No numbering or preamble."
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
            assessment_intruction=(
                "This is a conceptual oral question. Focus purely on candidate's veral explanation. "
                "Ignore any code blocks. "
                "CRITICAL: If the transcript is empty, nonsense (e.g. 'blah blah','testing') or irrelevent to the question, SCORE 0."
            )
        else:
            assessment_intruction=(
                "This is a coding challenge question. Evaluate the code logic and efficiency. "
                "Use the transcription only for insight into their thought process. "
                "CRITICAL: If the code is 'udefined',empty, just random comments, or random characters, SCORE 0."
            )
        
        system_prompt=(
            "You are a strict, fair technical interviewer. Your evaluation must be accurate and unbiased.\n"
            "CRITICAL EVALUATION RULES:\n"
            "1. If answer is gibberish/empty/irrelevant → technicalScore=0, confidenceScore=0\n"
            "2. Score based on: correctness, depth, clarity, edge case handling, code efficiency\n"
            "3. Return ONLY valid JSON (no markdown, no nested objects in string fields)\n"
            "4. Provide constructive, specific feedback\n"
            f"Assessment Context: {assessment_intruction}\n"
            "Output Format: {\"technicalScore\": (0-100), \"confidenceScore\": (0-100), \"aiFeedback\": \"string\", \"idealAnswer\": \"string\"}"
        )
        user_prompt=(
           
            f"Role: {request.role}\n"
            f"Question: {request.question}\n"
            f"Level: {request.level}\n"
            f"Verbal Answer: {request.user_answer or 'No verbal answer provided'}\n"
            f"Code Answer: {request.user_code or 'No code provided'}\n"
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
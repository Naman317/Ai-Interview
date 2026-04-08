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
from google import genai
import requests
from typing import List

# Load environment variables
load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "phi")
GEMINI_API_KEY = os.getenv("GEMINI_API")

# Try to import ollama and check if service is available
OLLAMA_AVAILABLE = False
try:
    import ollama
    # Double check if server is reachable
    try:
        requests.get("http://localhost:11434/api/tags", timeout=1)
        OLLAMA_AVAILABLE = True
        print("✓ Ollama service is reachable and running")
    except:
        OLLAMA_AVAILABLE = False
        print("⚠ Ollama package exists but service is NOT reachable on localhost:11434")
except ImportError:
    OLLAMA_AVAILABLE = False
    ollama = None
    print("⚠ Ollama package not installed, using Gemini/Mock logic")

# Configure Gemini Client
GEMINI_AVAILABLE = False
client = None
if GEMINI_API_KEY:
    try:
        # Standardize on gemini-1.5-flash for maximum reliability and broader key support
        client = genai.Client(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        print("✓ Gemini SDK Client initialized (Gemini 2 Flash)")
    except Exception as e:
        print(f"⚠ Gemini SDK initialization failed: {e}")
        GEMINI_AVAILABLE = False

# Normalize Approach (ensure it is a List[str])
def normalize_approach(data):
    """Ensures approach is always a list of strings for schema consistency."""
    if not data:
        return ["Approach details pending."]
    if isinstance(data, list):
        return [str(item) for item in data if item]
    if isinstance(data, str):
        # If it's a multi-line string, split it into a list
        if "\n" in data:
            # Split and clean bullet points/numbers
            return [line.strip().lstrip('123456789. -') for line in data.split('\n') if line.strip()]
        return [data.strip()]
    return ["Approach details currently unavailable."]

# Helper for Gemini Calls
def call_gemini(system_prompt, user_prompt, is_json=False):
    if not GEMINI_AVAILABLE or not client:
        return None
    try:
        model_id = 'gemini-2.5-flash'
        
        from google.genai import types
        
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json" if is_json else "text/plain"
        )
        
        response = client.models.generate_content(
            model=model_id,
            contents=user_prompt,
            config=config
        )
        
        if not response or not response.text:
            return None
            
        content = response.text.strip()
        
        # Robust JSON cleaning (GenAI SDK usually returns clean JSON if mime_type is set)
        if is_json:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            content = content.strip()
            
        return content
    except Exception as e:
        print(f"Gemini call failed: {e}")
        return None

# Pydub optional import
try:
    from pydub import AudioSegment
except (ImportError, ModuleNotFoundError):
    AudioSegment = None

# Initialize FastAPI app
app = FastAPI(title="AI Interviewer Microservice", version="1.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Whisper Lazy Loading
WHISPER_MODEL = None
def get_whisper_model():
    global WHISPER_MODEL
    if WHISPER_MODEL is None:
        try:
            print("Loading Whisper Model (lazy)...")
            WHISPER_MODEL = whisper.load_model("base.en")
            print("Whisper Model Loaded Successfully")
        except Exception as e:
            print(f"Whisper Load Error: {e}")
            return None
    return WHISPER_MODEL

# Models
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
    approach: List[str]
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

# Mock data for when Ollama is not available - NOW WITH REALISTIC & CV-AWARE INTERVIEW QUESTIONS
# These include variations that can be personalized based on resume
MOCK_QUESTIONS = {
    "MERN Stack Developer": {
        "Junior": [
            "Walk me through the last web application you built end-to-end. What was the problem you were solving and how did you structure your code?",
            "Tell me about a time when you had to troubleshoot a tricky bug. What was it, how did you identify the root cause, and what did you learn?",
            "Describe your experience with React. What's the most complex component you've built and what challenges did you run into?",
            "Walk me through how you would build a feature from scratch - from design to deployment. What would your process be?",
            "Tell me about your experience with asynchronous JavaScript. Give me a real example where you had to handle multiple async operations.",
            "How do you approach performance when building React applications? Tell me about a time you had to optimize something.",
            "Tell me about your experience with databases. How would you design a schema for a real product you know?",
            "Describe a time when you had to learn a new technology or framework quickly. How did you go about it?"
        ],
        "Mid-Level": [
            "Describe a production issue you've encountered. Walk me through how you discovered it, diagnosed it, and what you did to fix it and prevent it in the future.",
            "Tell me about a time when you had to make a trade-off decision between different technical approaches. What was the context and how did you decide?",
            "How do you approach debugging complex state management issues in React? Tell me about a specific time you had to solve something like this.",
            "Walk me through your approach to testing. What's your testing strategy and how do you decide what to test at each level?",
            "Tell me about a time you had to optimize a slow endpoint or query. What was the bottleneck and how did you improve performance?",
            "Describe your experience with code reviews. What do you typically look for and tell me about a time you caught something important.",
            "How would you design the architecture for a feature that needs to handle high concurrent users? What would you consider?",
            "Tell me about your experience scaling a system you built. What were the pain points and how did you address them?",
            "Walk me through how you would approach adding real-time capabilities to an application. What are the trade-offs?"
        ],
        "Senior": [
            "Design a system from scratch that needs to handle 10 million daily active users. Walk me through your architecture decisions and trade-offs.",
            "Tell me about a major refactoring you led. What was broken, how did you plan it, and how did you manage the risk?",
            "Describe your approach to system design. What principles do you follow and how do you balance consistency, availability, and partition tolerance?",
            "Tell me about your experience with distributed systems. What are the hardest problems you've solved and what did you learn?",
            "How do you think about technical debt? Give me a real example where you decided to pay it down and what the process looked like.",
            "Describe your philosophy on mentoring engineers. Tell me about a junior engineer you helped grow and how you approached it.",
            "Walk me through how you'd approach migrating a monolithic system to microservices. What would be your strategy?",
            "Tell me about a time when you had to make a difficult architectural decision under uncertainty. How did you gather information and make the decision?",
            "How do you think about system reliability and observability? Tell me about how you'd instrument a complex system."
        ]
    },
    "Frontend Developer": {
        "Junior": [
            "Tell me about a website or web application you built that you're proud of. Walk me through the problem you were solving and how you approached it.",
            "Tell me about your first experience with a frontend framework. What was challenging and how did you overcome it?",
            "Describe a time when you had to debug something that was broken. What was the issue and how did you figure out where to look?",
            "Walk me through how you would approach building a responsive design from scratch. What's your process?",
            "Tell me about your experience with CSS. What's the trickiest CSS problem you've solved?",
            "How do you stay up to date with frontend technologies? Tell me about something new you learned recently.",
            "Describe your experience with browser developer tools. How do you use them in your daily workflow?",
            "Tell me about a time you had to integrate with an external API. How did you handle it?"
        ],
        "Mid-Level": [
            "Tell me about the most complex interactive feature you've built. How did you approach the design and implementation?",
            "Describe a performance issue you discovered in a frontend application. How did you identify it and what did you do to fix it?",
            "Walk me through your approach to building accessible interfaces. Tell me about a time you had to fix accessibility issues.",
            "Tell me about your experience with state management. What problems have you solved with it and what trade-offs did you encounter?",
            "How do you approach testing frontend code? Walk me through your testing strategy.",
            "Describe a time when you had to refactor legacy code. What was wrong and how did you improve it?",
            "Tell me about your experience with performance optimization. What metrics matter and how do you measure them?",
            "Walk me through how you would structure a large-scale frontend application. What are the key considerations?"
        ],
        "Senior": [
            "Design a frontend architecture for a highly interactive application with millions of users. What would you prioritize and why?",
            "Tell me about your experience building and maintaining component libraries. What patterns have worked well?",
            "Describe your philosophy on frontend performance. How do you approach optimization and measurement?",
            "Tell me about a time you had to lead a major frontend refactor. How did you plan it and manage the risks?",
            "Walk me through your approach to frontend security. What are the main vectors you think about?",
            "How do you think about accessibility? Tell me about your approach to building inclusive experiences at scale.",
            "Describe your experience with advanced state management patterns. What have you learned about scaling frontend state?",
            "Tell me about your approach to mentoring junior frontend engineers. What do you focus on teaching them?"
        ]
    },
    "Full Stack Developer": {
        "Junior": [
            "Tell me about the first full-stack application you built. Walk me through the architecture and what you learned.",
            "Describe a feature you built end-to-end from backend to frontend. How did you approach it and what was challenging?",
            "Tell me about your first experience with databases. How did you approach schema design?",
            "Walk me through your experience deploying an application. What was the process and what went wrong?",
            "Tell me about a time you had to debug an issue that spanned both frontend and backend. How did you approach it?",
            "Describe your experience with APIs. How did you think about API design when building something from scratch?",
            "Tell me about the tools and services you used in your last project. Why did you choose them?",
            "Walk me through your experience with version control. How do you organize your workflow?"
        ],
        "Mid-Level": [
            "Tell me about a production issue you encountered. How did you diagnose it, what was the root cause, and how did you fix it?",
            "Walk me through how you would design an API for a real feature. What would you consider?",
            "Describe your approach to database design. Tell me about a time you had to optimize queries or restructure a schema.",
            "Tell me about your experience with authentication and authorization. How have you implemented these in real applications?",
            "Walk me through your approach to testing across the full stack. What's your strategy?",
            "Tell me about your experience with deployment and CI/CD. How do you ensure reliability in production?",
            "Describe a time when you had to scale a system you built. What were the bottlenecks and how did you address them?",
            "Tell me about your approach to code review. What do you look for and how do you provide feedback?"
        ],
        "Senior": [
            "Design a system that can handle 100 million requests per day. Walk me through your end-to-end architecture and trade-offs.",
            "Tell me about your philosophy on system design. What principles guide your architectural decisions?",
            "Describe a major technical initiative you led. How did you plan it, manage the risks, and ensure success?",
            "Tell me about your experience transitioning from a monolith to microservices. What were the lessons?",
            "Walk me through how you think about reliability and observability. How would you instrument a complex system?",
            "Describe your approach to technical leadership. How do you make architectural decisions and build consensus?",
            "Tell me about your experience building high-performing teams. How do you foster technical excellence?",
            "Walk me through a time you had to make a difficult technical decision under uncertainty. How did you approach it?"
        ]
    },
    "DevOps Engineer": {
        "Junior": [
            "Tell me about your hands-on experience with containerization. Walk me through how you would approach containerizing an application.",
            "Describe a CI/CD pipeline you built or worked with. What does it do and why was it set up that way?",
            "Tell me about your experience with infrastructure as code. What tools have you used and what problems did you solve?",
            "Walk me through your experience with Linux. What are the most important concepts you've learned?",
            "Tell me about a deployment that went wrong and what you learned from it.",
            "Describe your experience with monitoring and alerting. How do you know when something is wrong?",
            "Tell me about your experience with version control for infrastructure. How do you manage changes?",
            "Walk me through your experience with cloud platforms. Which one have you used most and how?"
        ],
        "Mid-Level": [
            "Design a CI/CD pipeline for a team shipping features daily. What would you include and why?",
            "Tell me about your approach to infrastructure monitoring and observability. What metrics matter?",
            "Describe a time when infrastructure scaling issues affected your deployment. How did you solve it?",
            "Walk me through your experience with Kubernetes or container orchestration. What have you learned?",
            "Tell me about your approach to disaster recovery and high availability. What have you actually implemented?",
            "Describe your experience with security in infrastructure. What are your main concerns?",
            "Tell me about infrastructure cost optimization. What strategies have worked?",
            "Walk me through how you would handle a production incident from an infrastructure perspective."
        ],
        "Senior": [
            "Design infrastructure for a company growing from 10 to 1000 engineers. What would you prioritize?",
            "Tell me about your philosophy on infrastructure as your platform. How do you empower teams?",
            "Describe your experience scaling infrastructure through major growth. What were the bottlenecks?",
            "Walk me through your approach to infrastructure cost optimization at scale.",
            "Tell me about a major infrastructure initiative you led. How did you plan and execute it?",
            "Describe your experience with service mesh or other advanced infrastructure patterns.",
            "Tell me about your approach to building reliable systems. How do you think about redundancy and failover?",
            "Walk me through your vision for infrastructure and DevOps in the future."
        ]
    },
    "Backend Developer": {
        "Junior": [
            "Tell me about the first backend service you built. Walk me through the architecture and what you learned.",
            "Describe a time when you had to optimize a slow database query. How did you identify the issue and what did you do?",
            "Tell me about your experience with REST APIs. How would you design an endpoint from scratch?",
            "Walk me through your experience with databases. Why did you choose the technologies you used?",
            "Tell me about a time when you had to debug a production issue. What was the problem and how did you solve it?",
            "Describe your experience with authentication and authorization. How have you implemented these?",
            "Tell me about your approach to testing backend code. What types of tests do you write and why?",
            "Walk me through a time when you had to integrate with an external service or API."
        ],
        "Mid-Level": [
            "Describe a production incident you caused or discovered. Walk me through how you debugged it, what you learned, and how you prevented it.",
            "Tell me about your experience designing APIs. How do you make decisions about endpoints, parameters, and response formats?",
            "Walk me through how you would architect a system that needs to process 1 million transactions per day reliably.",
            "Describe your experience with database optimization. Tell me about a time you had to scale a database or redesign a schema.",
            "Tell me about your approach to error handling and logging. How do you make systems observable?",
            "Describe a time when you had to refactor legacy code. What was wrong and how did you improve it?",
            "Tell me about your experience with caching strategies. How do you decide when and where to cache?",
            "Walk me through how you handle asynchronous operations and background jobs in your systems."
        ],
        "Senior": [
            "Design a backend system from scratch that handles 100 million requests daily with sub-100ms latency. Walk me through your architecture decisions.",
            "Tell me about a major refactoring or architectural change you led. How did you plan it, manage risks, and ensure success?",
            "Describe your philosophy on system design. What principles guide your architectural decisions?",
            "Tell me about your experience with microservices. When would you use them and what are the trade-offs?",
            "Walk me through how you think about reliability and failure handling. How do you build resilient systems?",
            "Describe your experience leading technical design discussions. How do you build consensus on architectural decisions?",
            "Tell me about your approach to designing for scale. What are the bottlenecks you think about early?",
            "Walk me through a time you had to make a difficult technical decision under uncertainty and resource constraints."
        ]
    },
    "Data Scientist": {
        "Junior": [
            "Tell me about your first machine learning project. What problem were you solving and how did you approach it?",
            "Walk me through your experience with data cleaning and preprocessing. What's the messiest dataset you've worked with?",
            "Describe your experience with basic ML algorithms. When would you use linear regression vs classification?",
            "Tell me about a time when your model didn't perform well. How did you debug it and what did you try?",
            "Walk me through your experience with Python and data science libraries like pandas and scikit-learn.",
            "Describe how you would approach feature engineering for a new problem. What's your process?",
            "Tell me about your experience with data visualization. How do you communicate insights to non-technical stakeholders?",
            "Walk me through your experience with train/test splits and cross-validation. Why do these matter?"
        ],
        "Mid-Level": [
            "Describe a machine learning system you built end-to-end. Walk me through data collection, model training, and deployment.",
            "Tell me about a time when you had to handle imbalanced data. What techniques did you use and why?",
            "Walk me through your experience with hyperparameter tuning. How do you approach optimization?",
            "Describe your experience with deep learning frameworks. When would you use neural networks vs traditional ML?",
            "Tell me about a time you had to explain a complex model to business stakeholders. How did you approach it?",
            "Walk me through your experience with A/B testing and experiment design. How do you measure model impact?",
            "Describe your approach to handling missing data. What strategies have worked in production?",
            "Tell me about your experience with model evaluation metrics. How do you choose which metrics matter for your problem?"
        ],
        "Senior": [
            "Design an end-to-end ML system from data collection through production for a company with millions of users. What are your considerations?",
            "Tell me about your philosophy on building ML systems. How do you balance complexity with interpretability and maintainability?",
            "Describe a time you led a major ML initiative. How did you set objectives, manage stakeholders, and measure success?",
            "Walk me through your experience with MLOps and model governance. How do you ensure models stay healthy in production?",
            "Tell me about your approach to building interpretable and fair ML systems. What are your concerns?",
            "Describe your experience with recommender systems or complex ML architectures. What are the unique challenges?",
            "Tell me about a time when you had to rebuild a model from scratch or migrate to new approaches. How did you manage that transition?",
            "Walk me through your vision for data science in your organization. How do you build scaling practices and teams?"
        ]
    },
    "QA Engineer": {
        "Junior": [
            "Tell me about your first project testing software. What did you test and what testing techniques did you use?",
            "Walk me through your experience writing automated tests. What tools have you used and why?",
            "Describe a bug you found that was really interesting or tricky to debug. How did you approach finding it?",
            "Tell me about your experience with different testing types - unit, integration, end-to-end. How are they different?",
            "Walk me through your approach to testing a new feature. What would you test and in what order?",
            "Describe your experience with test data management. How do you handle test environments and data?",
            "Tell me about your experience with CI/CD pipelines. How do tests fit into the deployment process?",
            "Walk me through a time when you had to test something you didn't fully understand. How did you approach it?"
        ],
        "Mid-Level": [
            "Describe a complex feature you tested end-to-end. Walk me through your test strategy and what edge cases you considered.",
            "Tell me about your approach to test automation. How do you decide what to automate vs test manually?",
            "Walk me through your experience with performance testing. How do you identify and debug performance regressions?",
            "Describe your experience with different testing frameworks. What are the trade-offs between different tools?",
            "Tell me about a time when you discovered a production bug. How did you approach reproducing and escalating it?",
            "Walk me through your approach to testing APIs. What aspects are most important to test?",
            "Describe your experience with test reporting and metrics. How do you measure testing effectiveness?",
            "Tell me about your approach to testing in an agile environment with rapid releases."
        ],
        "Senior": [
            "Design a comprehensive testing strategy for a complex system with millions of users. What would you prioritize?",
            "Tell me about your philosophy on quality and testing. How do you balance speed and quality?",
            "Describe a major quality initiative you led. How did you improve testing practices or reduce defects?",
            "Walk me through your experience with advanced testing concepts like chaos engineering or mutation testing.",
            "Tell me about your approach to building test automation at scale. What are the challenges?",
            "Describe your experience working with developers to improve code quality and testability.",
            "Tell me about your approach to testing in different environments - dev, staging, production.",
            "Walk me through your vision for quality engineering in organizations. How do you build quality culture?"
        ]
    }
}

@app.get("/")
async def root():
    return {"message":"Hello from AI Interviewer Microservice !","model":OLLAMA_MODEL_NAME}


def parse_cv_for_question_generation(resume_context: Optional[str], resume_skills: Optional[list[str]], resume_experience_years: Optional[int]) -> dict:
    """
    Parse CV data into structured format for targeted question generation
    Returns: dict with extracted CV information for question personalization
    """
    cv_data = {
        "has_resume": bool(resume_context or resume_skills),
        "skills": resume_skills or [],
        "experience_years": resume_experience_years or 0,
        "background": resume_context or "",
        "primary_skills": (resume_skills[:5] if resume_skills else []) or [],
        "secondary_skills": (resume_skills[5:] if resume_skills and len(resume_skills) > 5 else []) or [],
    }
    return cv_data


def generate_cv_specific_prompts(cv_data: dict, role: str, level: str) -> tuple:
    """
    Generate targeted prompt sections based on actual CV content
    Returns: (cv_focused_instruction, skill_specific_instruction)
    """
    cv_focused = ""
    skill_instruction = ""
    
    if cv_data["has_resume"]:
        if cv_data["primary_skills"]:
            skills_str = ", ".join(cv_data["primary_skills"])
            cv_focused += f"\nCANDIDATE'S KEY SKILLS: {skills_str}\n"
            skill_instruction += (
                f"SKILL-SPECIFIC QUESTIONS (HIGH PRIORITY):\n"
                f"- Ask SPECIFIC questions about: {skills_str}\n"
                f"- These should be 50% of your questions\n"
                f"- Ask: 'Tell me about your experience with [specific skill]'\n"
                f"- Ask follow-ups that probe depth of knowledge in these areas\n"
            )
        
        if cv_data["secondary_skills"]:
            secondary_str = ", ".join(cv_data["secondary_skills"])
            cv_focused += f"SECONDARY SKILLS: {secondary_str}\n"
            skill_instruction += f"- Also ask about: {secondary_str} (lighter probing)\n"
        
        if cv_data["experience_years"]:
            cv_focused += f"EXPERIENCE: {cv_data['experience_years']} years\n"
            if cv_data["experience_years"] < 2:
                skill_instruction += "- They're early career - focus on learning ability and fundamentals\n"
            elif cv_data["experience_years"] < 5:
                skill_instruction += "- They have some experience - ask about projects and decisions made\n"
            else:
                skill_instruction += "- They're experienced - ask about architecture, scaling, mentoring\n"
        
        if cv_data["background"]:
            cv_focused += f"BACKGROUND: {cv_data['background'][:200]}...\n"
            skill_instruction += (
                f"- Reference their background/projects in questions\n"
                f"- Ask about specific challenges they likely faced\n"
            )
    else:
        skill_instruction += (
            "WARNING: No resume provided - use more general questions\n"
            "But ask about their experience to get context\n"
        )
    
    return cv_focused, skill_instruction


def create_cv_aware_system_prompt(interview_instruction: str, difficulty_instruction: str, cv_data: dict, role: str, level: str) -> str:
    """
    Create a comprehensive system prompt that balances role-specific and CV-specific questions
    """
    cv_focused_text, skill_specific_text = generate_cv_specific_prompts(cv_data, role, level)
    
    system_prompt = (
        "You are an experienced technical interviewer conducting a real interview. "
        "Your goal: Generate questions that assess the candidate fairly based on their actual experience.\n"
        f"{interview_instruction}\n"
        f"{difficulty_instruction}\n"
        f"{cv_focused_text}\n"
        f"{skill_specific_text}\n"
        "QUESTION GENERATION STRATEGY:\n"
        "1. IF RESUME PROVIDED:\n"
        "   - 50% of questions should ask specifically about their skills/tech/background\n"
        "   - 30% should be role-specific general questions\n"
        "   - 20% situational/behavioral based on their level\n"
        "2. IF NO RESUME:\n"
        "   - Start with discovery questions ('Tell me about your background with...')\n"
        "   - Then ask role-specific questions\n"
        "3. FOR EACH SKILL/TECHNOLOGY ON RESUME:\n"
        "   - Ask at least one specific question about it\n"
        "   - Follow up on how they used it (not just 'explain what it is')\n"
        "   - Ask about challenges encountered\n"
        "4. QUESTION TYPES TO MIX:\n"
        "   - Experience-based: 'Tell me about [specific tech from their resume]'\n"
        "   - Application-based: 'How have you used [skill] to solve...'\n"
        "   - Decision-based: 'Why did you choose [tech] over [alternative]...'\n"
        "   - Challenge-based: 'What's the hardest problem you've solved with [skill]...'\n"
        "   - Growth-based: 'How did you learn [skill]...'\n"
        "5. AVOID:\n"
        "   - Generic definition questions unless they don't know the tech\n"
        "   - Questions about technologies NOT on their resume (unless probing gaps)\n"
        "   - 'Explain X' questions - instead ask about their experience with X\n"
        "\nQUESTION QUALITY STANDARDS:\n"
        "- Each question personalizes to their actual CV when possible\n"
        "- Questions reveal depth of real-world experience\n"
        "- Conversational tone, as if spoken by interviewer\n"
        "- Progressive difficulty from comfortable (their skills) to challenging (advanced)\n"
        "\nOUTPUT FORMAT:\n"
        "1. Output EXACTLY ONE question per line\n"
        "2. NO numbering, NO explanations, NO extra text\n"
        "3. Each question should mention specific skills/tech from their CV\n"
        "4. Questions are conversational and immediately ready to ask"
    )
    
    return system_prompt


@app.post("/generate-questions",response_model=QuestionResponse)
async def generate_questions(request:QuestionResquest):
    try:
        # Parse CV data for personalization
        cv_data = parse_cv_for_question_generation(
            request.resume_context,
            request.resume_skills,
            request.resume_experience_years
        )
        
        # Check if any AI service is available
        if not OLLAMA_AVAILABLE and not GEMINI_AVAILABLE:
            role = request.role if request.role in MOCK_QUESTIONS else "MERN Stack Developer"
            level = request.level if request.level in MOCK_QUESTIONS.get(role, {}) else "Junior"
            questions = MOCK_QUESTIONS.get(role, {}).get(level, [])[:request.count]
            
            # Try to personalize mock questions if CV data available
            if cv_data["has_resume"] and cv_data["primary_skills"]:
                personalized = []
                for skill in cv_data["primary_skills"][:2]:
                    personalized.append(f"Tell me about your experience with {skill}. How have you used it in production?")
                if cv_data["experience_years"]:
                    personalized.append(f"With {cv_data['experience_years']} years of experience, describe the most complex project you've worked on.")
                questions = personalized + questions[:request.count - len(personalized)]
            
            return QuestionResponse(questions=questions[:request.count], model_used="mock-questions")
        
        # Interview type specific instructions
        if request.interview_type == "video":
            interview_focus = "behavioral_and_communication"
            interview_instruction = (
                "Video interviews assess communication, presence, and thought process clarity. "
                "Ask questions that reveal how they handle pressure and communicate ideas. "
                "Mix technical questions with behavioral questions (STAR method compatible)."
            )
        elif request.interview_type == "voice":
            interview_focus = "technical_and_behavioral"
            interview_instruction = (
                "Voice interviews focus on technical depth and problem-solving communication. "
                "Ask progressively harder technical questions about their specific experience. "
                "Probe into actual decisions they've made and challenges they've overcome."
            )
        else:
            interview_focus = "coding_and_technical"
            interview_instruction = (
                "Coding interviews assess algorithm knowledge, code quality, and problem-solving approach. "
                "Ask about real projects and specific technical implementations. "
                "Mix problem-solving with architectural decision questions."
            )

        # Experience level specific instructions
        if request.level.lower() == "junior":
            difficulty_instruction = (
                "JUNIOR LEVEL:\n"
                "- Ask about specific projects they've completed\n"
                "- Assess foundational understanding and learning ability\n"
                "- Ask 'How would you learn...' for unfamiliar technologies\n"
                "- Mix hands-on (`How did you build...`) with conceptual questions\n"
                "- Look for problem-solving approach, not just right answer"
            )
        elif request.level.lower() in ["mid-level", "mid level"]:
            difficulty_instruction = (
                "MID-LEVEL:\n"
                "- Ask about architectural decisions and tradeoffs\n"
                "- Probe into system design and scalability\n"
                "- Ask about code reviews, mentoring, and technical leadership\n"
                "- Questions about handling ambiguity and unclear requirements\n"
                "- Mix technical depth with team/project management"
            )
        else:  # Senior
            difficulty_instruction = (
                "SENIOR LEVEL:\n"
                "- Focus on complex system design and architectural decisions\n"
                "- Ask about scaling challenges and technical debt management\n"
                "- Questions on mentoring, code reviews, and engineering culture\n"
                "- Probe strategy, vision, and long-term thinking\n"
                "- Ask about failures, learnings, and how they'd do things differently"
            )
        
        # CREATE CV-AWARE SYSTEM PROMPT
        system_prompt = create_cv_aware_system_prompt(
            interview_instruction,
            difficulty_instruction,
            cv_data,
            request.role,
            request.level
        )
        
        # BUILD USER PROMPT - WITH CV EMPHASIS
        user_prompt = f"Generate exactly {request.count} interview questions for a {request.level} level {request.role}."

        # TRY OLLAMA FIRST (User Requested Priority)
        if OLLAMA_AVAILABLE:
            try:
                response = ollama.generate(
                    model=OLLAMA_MODEL_NAME,
                    prompt=user_prompt,
                    system=system_prompt,
                    stream=False,
                    options={"temperature": 0.7, "top_p": 0.9, "top_k": 40}
                )
                raw_text = response['response'].strip()
                questions = [q.strip() for q in raw_text.split('\n') if q.strip()]
                if len(questions) > 0:
                    return QuestionResponse(questions=questions[:request.count], model_used=OLLAMA_MODEL_NAME)
            except Exception as e:
                print(f"Ollama generation failed: {e}")

        # FALLBACK TO GEMINI
        if GEMINI_AVAILABLE:
            result = call_gemini(system_prompt, user_prompt)
            if result:
                questions = [q.strip() for q in result.split('\n') if q.strip()]
                # Even if we got slightly fewer questions, Gemini questions are better than mock questions
                if len(questions) > 0:
                    return QuestionResponse(questions=questions[:request.count], model_used="gemini-2.5-flash")

        # If we reach here, both AI services failed or returned empty. Fall back to mock questions
        role = request.role if request.role in MOCK_QUESTIONS else "MERN Stack Developer"
        level = request.level if request.level in MOCK_QUESTIONS.get(role, {}) else "Junior"
        questions = MOCK_QUESTIONS.get(role, {}).get(level, [])[:request.count]
        
        # Personalize with CV if available
        if cv_data["has_resume"] and cv_data["primary_skills"]:
            personalized = []
            for skill in cv_data["primary_skills"][:2]:
                personalized.append(f"Tell me about your experience with {skill}. How have you used it in production?")
            if cv_data["experience_years"]:
                personalized.append(f"With {cv_data['experience_years']} years of experience, walk me through the most complex system you've built.")
            questions = personalized + questions[:request.count - len(personalized)]
        
        return QuestionResponse(questions=questions[:request.count], model_used="mock-questions")



    except Exception as e:
        print(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
async def transcribe_audio(audioFile:UploadFile=File(...)):
    temp_audio_path = None
    try:
        model = get_whisper_model()
        if not model:
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
        def format_dict_field(field_val, default_val):
            if not field_val:
                return default_val
            if isinstance(field_val, dict):
                formatted = ""
                for k, v in field_val.items():
                    formatted += f"{str(k).capitalize()}: {str(v)}\n\n"
                return formatted.strip()
            return str(field_val).strip()

        # Generate role-specific ideal answers
        def get_ideal_answer(role: str, level: str) -> str:
            role_guidance = {
                "Backend Developer": {
                    "Junior": "A good answer should describe a specific project, the technologies used, the architecture you designed, challenges you encountered, and how you overcame them. Include details about databases, APIs, scaling considerations, and what you learned.",
                    "Mid-Level": "Excellent answer includes incident details (what broke, when discovered, root cause), your debugging methodology, how you fixed it, prevention measures implemented, and impact on the system. Shows production thinking and ownership.",
                    "Senior": "Outstanding answer demonstrates system design thinking, trade-off analysis between consistency/availability, how you led the initiative, learnings from failures, and how you mentored others through the process. Shows strategic thinking."
                },
                "MERN Stack Developer": {
                    "Junior": "Strong answer describes a specific web application you built, the problem it solved, the React components you created, how you handled state, performance optimization, and what challenges you overcame. Shows end-to-end thinking.",
                    "Mid-Level": "Great answer includes production incidents, debugging complex state management issues, performance profiling and optimization, testing strategy (unit/integration/E2E), and decisions around technology choices.",
                    "Senior": "Excellent answer shows system design for scale (10M DAU considerations), architecture decisions, monitoring/observability setup, technical leadership, how you mentored junior engineers, and lessons learned."
                },
                "Frontend Developer": {
                    "Junior": "Good answer describes a website or app you built, the user problems you solved, how you structured components, CSS challenges, responsive design approach, and what you learned from the experience.",
                    "Mid-Level": "Strong answer includes complex interactive features you built, performance optimization techniques, accessibility considerations, state management decisions, and how you tested across browsers/devices.",
                    "Senior": "Outstanding answer covers frontend architecture for millions of users, component library design, performance monitoring in production, accessibility at scale, security considerations, and how you led frontend initiatives."
                },
                "Data Scientist": {
                    "Junior": "Good answer describes your ML project, the problem you solved with data, data preprocessing steps, which algorithm you chose and why, how you evaluated the model, and what you learned.",
                    "Mid-Level": "Strong answer includes end-to-end ML system, handling imbalanced data, hyperparameter tuning approach, A/B testing methodology, model evaluation metrics chosen, and how you communicated results to stakeholders.",
                    "Senior": "Excellent answer demonstrates MLOps thinking, model governance, fairness and interpretability considerations, scaling ML systems, production monitoring, and how you led data science initiatives across teams."
                },
                "QA Engineer": {
                    "Junior": "Good answer describes testing approach, testing types you used (unit/integration/E2E), how you identified a bug, steps to reproduce it, and how it was fixed. Shows testing methodology.",
                    "Mid-Level": "Strong answer includes test automation strategy, performance testing experience, CI/CD integration, how you manage test data, complex scenarios tested, and trade-offs between manual and automated testing.",
                    "Senior": "Outstanding answer demonstrates comprehensive testing strategy, test pyramid thinking, advanced testing (chaos/mutation), how you built quality culture, test automation at scale, and led quality initiatives."
                }
            }
            
            role_key = role if role in role_guidance else "Backend Developer"
            level_key = level if level in role_guidance.get(role_key, {}) else "Junior"
            return role_guidance.get(role_key, {}).get(level_key, "A comprehensive answer addressing all aspects of the question with specific examples and demonstrating deep understanding of the concepts.")
        
        # If Ollama is not available, return mock evaluation
        if not OLLAMA_AVAILABLE:
            # Generate a mock evaluation based on answer length and content
            answer_text = (request.user_answer or "") + (request.user_code or "")
            if not answer_text.strip():
                return EvaluationResponse(
                    technicalScore=0,
                    confidenceScore=0,
                    aiFeedback="No answer provided. Please provide a verbal or code response.",
                    idealAnswer=get_ideal_answer(request.role, request.level)
                )
            else:
                answer_length = len(answer_text.split())
                # Better scoring based on answer length
                tech_score = min(75, 40 + (answer_length // 20))
                conf_score = min(80, 50 + (answer_length // 30))
                return EvaluationResponse(
                    technicalScore=tech_score,
                    confidenceScore=conf_score,
                    aiFeedback="Your answer shows understanding of the topic. To improve: provide more specific examples from your actual experience, discuss trade-offs and decisions you made, and explain your thought process more clearly.",
                    idealAnswer=get_ideal_answer(request.role, request.level)
                )

        # 1. PREPARE PROMPTS
        if request.question_type == "oral":
            assessment_instr = "ORAL/BEHAVIORAL: Assess communication, clarity, and depth."
        else:
            assessment_instr = "TECHNICAL: Assess correctness, efficiency, and problem-solving."

        system_prompt = (
            "You are an expert interviewer. Evaluate based on: technicalScore (0-100), confidenceScore (0-100), aiFeedback, idealAnswer.\n"
            f"Context: {assessment_instr}\n"
            "Return JSON only."
        )

        user_prompt = (
            f"Role: {request.role}, Level: {request.level}\n"
            f"Question: {request.question}\n"
            f"Answer: {request.user_answer}\n"
            f"Code: {request.user_code}"
        )

        # 2. TRY OLLAMA FIRST (User Requested Priority)
        if OLLAMA_AVAILABLE:
            try:
                if request.question_type == "oral":
                    response = ollama.generate(
                        model=OLLAMA_MODEL_NAME,
                        prompt=user_prompt,
                        system=system_prompt,
                        format="json",
                        stream=False,
                        options={"temperature":0.2, "top_p":0.85}
                    )
                else:
                    response = ollama.generate(
                        model=OLLAMA_MODEL_NAME,
                        prompt=user_prompt,
                        system=system_prompt,
                        format="json",
                        stream=False,
                        options={"temperature":0.2, "top_p":0.85}
                    )
                response_text = response['response'].strip()
                # Process Ollama response JSON
                evaluation_data = json.loads(response_text)
                evaluation_data['aiFeedback'] = format_dict_field(evaluation_data.get('aiFeedback'), "Good effort.")
                evaluation_data['idealAnswer'] = format_dict_field(evaluation_data.get('idealAnswer'), get_ideal_answer(request.role, request.level))
                return EvaluationResponse(**evaluation_data)
            except Exception as e:
                print(f"Ollama evaluation failed: {e}")

        # 3. FALLBACK TO GEMINI
        if GEMINI_AVAILABLE:
            result = call_gemini(system_prompt, user_prompt, is_json=True)
            if result:
                try:
                    data = json.loads(result)
                    return EvaluationResponse(
                        technicalScore=int(data.get('technicalScore', 70)),
                        confidenceScore=int(data.get('confidenceScore', 70)),
                        aiFeedback=format_dict_field(data.get('aiFeedback'), "Good effort."),
                        idealAnswer=format_dict_field(data.get('idealAnswer'), get_ideal_answer(request.role, request.level))
                    )
                except Exception as e:
                    print(f"Gemini evaluation parsing failed: {e}")

        # If both AI services fail, return mock evaluation
        print(f"Both AI services failed evaluation. Falling back to mock data.")
        answer_text = (request.user_answer or "") + (request.user_code or "")
        if not answer_text.strip():
            return EvaluationResponse(
                technicalScore=0,
                confidenceScore=0,
                aiFeedback="No answer provided. Please provide a verbal or code response.",
                idealAnswer=get_ideal_answer(request.role, request.level)
            )
        else:
            answer_length = len(answer_text.split())
            # Better scoring based on answer length
            tech_score = min(75, 40 + (answer_length // 20))
            conf_score = min(80, 50 + (answer_length // 30))
            return EvaluationResponse(
                technicalScore=tech_score,
                confidenceScore=conf_score,
                aiFeedback="Your answer shows understanding of the topic. To improve: provide more specific examples from your actual experience, discuss trade-offs and decisions you made, and explain your thought process more clearly.",
                idealAnswer=get_ideal_answer(request.role, request.level)
            )

    except Exception as e:
        print(f"Failed to generate response: {e}")
        # Gracefully handle critical errors - ALWAYS return meaningful evaluation
        return EvaluationResponse(
            technicalScore=0,
            confidenceScore=0,
            aiFeedback="Your submission could not be fully evaluated due to a system issue. Your answer has been recorded. Key areas to improve: provide concrete examples from your experience, explain your decision-making process, discuss why you chose specific approaches, and mention any challenges you overcame.",
            idealAnswer=get_ideal_answer(request.role, request.level)
        )

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
        model = get_whisper_model()
        if not model:
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
            model = get_whisper_model()
            if not model:
                raise Exception("Whisper model unavailable")
            result = model.transcribe(audio_path)
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
                def format_dict_field(field_val, default_val):
                    if not field_val:
                        return default_val
                    if isinstance(field_val, dict):
                        formatted = ""
                        for k, v in field_val.items():
                            formatted += f"{str(k).capitalize()}: {str(v)}\n\n"
                        return formatted.strip()
                    return str(field_val).strip()

                system_prompt = (
                    "You are an expert technical interviewer evaluating a candidate's video interview response. "
                    "Review the provided transcript of their answer to the specific question asked.\n\n"
                    "EVALUATION CRITERIA:\n"
                    "1. Technical Score (0-100): Rate their technical accuracy and depth based on their role and experience level.\n"
                    "2. AI Feedback: Provide comprehensive, constructive feedback. Highlight strengths and suggest specific areas for improvement, directly addressing their answer.\n\n"
                    "Respond ONLY with a JSON object. "
                    "Required keys: 'technicalScore' (integer 0-100), 'aiFeedback' (string)."
                )

                user_prompt = (
                    f"Role: {role}\n"
                    f"Level: {level}\n"
                    f"Question: {question}\n"
                    f"Transcript: {transcript}\n\n"
                    f"Evaluate this response fairly and provide a detailed analysis."
                )

                response = ollama.generate(
                    model=OLLAMA_MODEL_NAME,
                    prompt=user_prompt,
                    system=system_prompt,
                    format="json",
                    options={"temperature": 0.2}
                )
                
                analysis_data = json.loads(response['response'].strip())
                technical_score = analysis_data.get('technicalScore', 75)
                
                # Protect against dictionary returns
                raw_feedback = analysis_data.get('aiFeedback')
                ai_feedback = format_dict_field(raw_feedback, "Good response. Try to elaborate on technical specifics in the future.")
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

        

# Preset guides for common problems to ensure premium quality even without LLM
PRESET_GUIDES = {
    "two sum": {
        "approach": [
            "Initialize a hash map to store numbers and their indices.",
            "Iterate through the array once, calculating the complement (target - current_val).",
            "If the complement exists in the map, return indices. Otherwise, add current number to map."
        ],
        "verbalization": "I'll use a one-pass hash map approach to find the complement in O(1) time. As I iterate through the array, I'll check if the value needed to reach the target hash been seen before. If it has, I've found my pair. This yields an O(N) time complexity.",
        "complexityAnalysis": {"time": "O(N)", "space": "O(N)"}
    },
    "binary search": {
        "approach": [
            "Maintain two pointers, left and right, spanning the searchable range.",
            "In each step, calculate the midpoint and compare it to the target.",
            "Adjust the pointers to halve the search space until target is found or range is empty."
        ],
        "verbalization": "I'll use a standard binary search approach with low and high pointers. At each step, I'll calculate the median. If the target is smaller, I'll move my high pointer; if larger, I'll move my low pointer. This effectively cuts the search space in half each iteration.",
        "complexityAnalysis": {"time": "O(log N)", "space": "O(1)"}
    },
    "minimum ascii delete sum for two strings": {
        "approach": [
            "Initialize a 2D DP table where dp[i][j] represents the minimum ASCII delete sum for s1[i:] and s2[j:].",
            "Fill the base cases: if one string is empty, the cost is the sum of ASCII values of the remaining characters in the other string.",
            "If s1[i] == s2[j], the cost is simply dp[i+1][j+1] (no deletion needed).",
            "Otherwise, take the minimum of (ASCII(s1[i]) + dp[i+1][j]) and (ASCII(s2[j]) + dp[i][j+1]).",
            "The result is stored in dp[0][0]."
        ],
        "verbalization": "I'll solve this using 2D Dynamic Programming. The state dp[i][j] will store the minimum cost to make the suffixes of both strings equal. When characters match, we move diagonally without cost. When they don't, we branch into two possibilities—deleting from string A or string B—and take the minimum ASCII cost. This results in an O(M*N) solution where M and N are the string lengths.",
        "complexityAnalysis": {"time": "O(M * N)", "space": "O(M * N)"}
    },
    "maximum value at a given index in a bounded array": {
        "approach": [
            "Recognize that as the value at the index increases, the total sum of the array increases monotonically, allowing for Binary Search on the answer.",
            "For a given 'mid' value at index 'index', calculate the minimum possible sum of the array by decreasing values by 1 towards both ends (until 1).",
            "Use the arithmetic progression sum formula: Sum = n/2 * (a + l) to calculate the left and right side sums in O(1) time.",
            "If the calculated sum is <= maxSum, the value 'mid' is possible, so try larger values; otherwise, try smaller."
        ],
        "verbalization": "I'll use Binary Search on the possible value at the given index. Since the sum is monotonic with respect to this value, we can search between 1 and maxSum. For each middle value, I'll calculate the minimum array sum using the property that values should decrease by 1 as we move away from the index to stay within the bound. This calculation is done in O(1) using the arithmetic progression formula, leading to an overall O(log(maxSum)) time complexity.",
        "complexityAnalysis": {"time": "O(log(maxSum))", "space": "O(1)"}
    },
    "median of two sorted arrays": {
        "approach": [
            "Use a binary search approach to find the correct partition point in the smaller of the two arrays.",
            "Maintain the invariant that the total number of elements on the left side of the partition is (m + n + 1) / 2.",
            "Ensure that maxLeft1 <= minRight2 and maxLeft2 <= minRight1.",
            "Handle edge cases where the partition is at the beginning or end of either array."
        ],
        "verbalization": "I'll use an optimized binary search approach to partition the two arrays such that all elements on the left are smaller than or equal to elements on the right. By searching on the smaller array, we achieve O(log(min(M,N))) complexity. We look for a partition where the maximum element of the left halves is smaller than the minimum element of the right halves.",
        "complexityAnalysis": {"time": "O(log(min(M, N)))", "space": "O(1)"}
    }
}

@app.post("/generate-guide", response_model=GuideResponse)
async def generate_guide(request: GuideRequest):
    try:
        # Normalized key for partial matching
        incoming_title = request.title.lower().strip().replace("  ", " ").replace("-", " ")
        print(f"DEBUG: Processing Guide Request for: '{incoming_title}'")
        
        # FUZZY PRESET MATCHING: Check if the title mentions a key problem term
        matched_preset = None
        for key, data in PRESET_GUIDES.items():
            if key in incoming_title or incoming_title in key:
                print(f"✓ PRESET MATCH FOUND: Using preset for '{key}'")
                matched_preset = data
                break
        
        if matched_preset:
            return GuideResponse(
                approach=normalize_approach(matched_preset.get('approach')),
                verbalization=matched_preset.get('verbalization'),
                complexityAnalysis=matched_preset.get('complexityAnalysis')
            )

        # TRY GEMINI FIRST
        if GEMINI_AVAILABLE:
            model_id = 'gemini-1.5-flash'
            system_instruction = (
                "You are a Senior Technical Interviewer and Algorithm Expert. "
                "Your task is to provide a comprehensive, high-quality interview strategy for the given coding problem.\n\n"
                "EXPECTED OUTPUT (JSON):\n"
                "1. 'approach': A list of 3-5 clear, logical steps to solve the problem (from brute force to optimal).\n"
                "2. 'verbalization': A professional 3-sentence script that a candidate would use to explain their strategy to an interviewer.\n"
                "3. 'complexityAnalysis': An object with 'time' and 'space' keys using Big-O notation. "
                "CRITICAL: Be extremely precise. For example, DP is usually O(N*M), sorting is O(N log N), etc. "
                "Do NOT default to O(N) unless it is actually linear."
            )
            
            prompt = (
                f"PROBLEM TITLE: {request.title}\n"
                f"DESCRIPTION: {request.description}\n"
                f"CATEGORY/TAGS: {request.tags}\n\n"
                "Provide the strategy guide now."
            )
            
            result = call_gemini(system_instruction, prompt, is_json=True)
            if result:
                try:
                    data = json.loads(result)
                    
                    # Robust type handling to prevent Pydantic crashes
                    verb = data.get('verbalization')
                    if isinstance(verb, list):
                        verb = " ".join(str(v) for v in verb)
                    elif not isinstance(verb, str):
                        verb = "I'm analyzing the optimal strategy for this problem."
                        
                    comp = data.get('complexityAnalysis')
                    if not isinstance(comp, dict):
                        comp = {"time": "O(Analysis Pending)", "space": "O(Analysis Pending)"}
                        
                    return GuideResponse(
                        approach=normalize_approach(data.get('approach')) or ["Strategic analysis in progress."],
                        verbalization=verb,
                        complexityAnalysis=comp
                    )
                except Exception as e:
                    print(f"Error parsing Gemini response: {e}")

        # FALLBACK TO OLLAMA
        if OLLAMA_AVAILABLE:
            system_instr = (
                "As an Algorithm Expert, provide a JSON strategy guide for the coding problem below. "
                "Include 'approach' (steps), 'verbalization' (expert script), and 'complexityAnalysis' (time, space). "
                "Be technically accurate and precise with Big-O notation."
            )
            
            prompt = f"Problem: {request.title}\nDescription: {request.description}\nTags: {request.tags}"
            
            response = ollama.generate(
                model=OLLAMA_MODEL_NAME, 
                prompt=prompt,
                system=system_instr,
                format="json"
            )
            content = response['response'].strip()
            
            # Clean up JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            content = content.strip()
                
            data = json.loads(content)
            return GuideResponse(
                approach=normalize_approach(data.get('approach')),
                verbalization=data.get('verbalization', "Strategy explanation pending."),
                complexityAnalysis=data.get('complexityAnalysis', {"time": "Check Analysis", "space": "Check Analysis"})
            )
        
        # If both fail, return mock
        print("⚠ ALL AI ANALYSTS FAILED: Returning Analysis Pending response")
        return GuideResponse(
            approach=["Technical analysis pending initialization.", "Try refreshing in a few moments."],
            verbalization="I'm still analyzing this problem's pattern. I'll provide a walk-through once the technical engine completes its scan.",
            complexityAnalysis={"time": "O(Analysis Pending)", "space": "O(Analysis Pending)"}
        )
    except Exception as e:
        print(f"CRITICAL: Guide generation failed: {e}")
        return GuideResponse(
            approach=["AI Service temporarily unavailable."],
            verbalization="My algorithmic analysis engine is currently scaling. Please try again soon.",
            complexityAnalysis={"time": "O(Refetch)", "space": "O(Refetch)"}
        )

@app.post("/generate-problem", response_model=ProblemResponse)
async def generate_problem(request: ProblemRequest):
    try:
        # TRY GEMINI FIRST
        if GEMINI_AVAILABLE:
            prompt = f"Generate coding problem for Title: {request.title}, Company: {request.company}. JSON: description, examples (input, output, explanation), testCases (input, expectedOutput as string), constraints."
            result = call_gemini("Problem Generator", prompt, is_json=True)
            if result:
                return ProblemResponse(**json.loads(result))

        # FALLBACK TO OLLAMA
        if OLLAMA_AVAILABLE:
            prompt = f"Generate problem for Title: {request.title}, Company: {request.company}. JSON: description, examples, testCases, constraints."
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
        
        # If both fail
        return ProblemResponse(
            description=f"Problem details for {request.title} are currently unavailable.",
            examples=[],
            testCases=[],
            constraints=[]
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
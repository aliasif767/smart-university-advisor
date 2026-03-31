# =============================================================================
# app.py  —  FastAPI backend for Agentic Student Chatbot
# =============================================================================
# Endpoints:
#   POST /api/chat         — streaming chat (basic, backward-compatible)
#   POST /api/chat/agent   — streaming chat WITH agentic action execution
#   GET  /api/health       — health check
# =============================================================================

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from chatbot import WebsiteRAGChatbot, ActionExecutor, parse_action, strip_action
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise chatbot once at startup
chatbot = WebsiteRAGChatbot(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    document_path="website_info.txt"
)
chatbot.load_and_process_document()


# ── Basic streaming endpoint (original, unchanged) ────────────────────────────
@app.post("/api/chat")
async def chat_streaming(request: Request):
    data  = await request.json()
    query = data.get("query", "")

    context = chatbot.retrieve_context(query)

    def generate():
        stream = chatbot.client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {query}"
            }],
            model=chatbot.model_name,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    return StreamingResponse(generate(), media_type="text/plain")


# ── Agentic streaming endpoint ────────────────────────────────────────────────
@app.post("/api/chat/agent")
async def agent_chat_streaming(request: Request):
    """
    Request body:
    {
        "query"  : "I want to apply for sick leave",
        "student": {"firstName": "Ali", "lastName": "Khan", "studentId": "2021-CS-001"},
        "token"  : "jwt_token_here"   // student's auth token for API calls
    }

    Response: streaming text.
    When an action is detected the backend executes it against the Node.js API
    and streams the result back to the frontend automatically.
    """
    data    = await request.json()
    query   = data.get("query", "")
    student = data.get("student", {})
    token   = data.get("token") or request.headers.get("Authorization", "").replace("Bearer ", "")

    executor = ActionExecutor(token=token)

    async def generate():
        action_json  = None
        display_text = ""

        # Stream LLM response chunk by chunk
        for chunk in chatbot.stream_response(query, student=student):
            # Detect the action sentinel appended by stream_response()
            if chunk.startswith("\n__ACTION__"):
                action_json = chunk.replace("\n__ACTION__", "").strip()
                break   # don't send the sentinel to the frontend
            else:
                display_text += chunk
                yield chunk

        # If an action was requested, execute it and stream the result
        if action_json:
            try:
                action = json.loads(action_json)
                tool   = action.get("tool", "")
                params = action.get("params", {})

                # Tell frontend an action is running
                yield f"\n\n⚙️ Running: **{tool.replace('_', ' ').title()}**…\n"

                result      = await executor.execute(tool, params)
                result_text = executor.format_result(tool, result)

                yield f"\n{result_text}"

            except Exception as e:
                yield f"\n\n❌ Action failed: {str(e)}\nPlease try again or use the dashboard directly."

    return StreamingResponse(generate(), media_type="text/plain")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "model": chatbot.model_name}
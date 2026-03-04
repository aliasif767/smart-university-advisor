from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from chatbot import WebsiteRAGChatbot
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot = WebsiteRAGChatbot(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    document_path="website_info.txt"
)
chatbot.load_and_process_document()

@app.post("/api/chat")
async def chat_streaming(request: Request):
    data = await request.json()
    query = data.get("query")
    
    # 1. Get context using existing RAG logic
    context = chatbot.retrieve_context(query)
    
    def generate():
        # 2. Call Groq with stream=True
        stream = chatbot.client.chat.completions.create(
            messages=[{
                "role": "user", 
                "content": f"Context:\n{context}\n\nQuestion: {query}"
            }],
            model=chatbot.model_name,
            stream=True, # This enables streaming
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    return StreamingResponse(generate(), media_type="text/plain")
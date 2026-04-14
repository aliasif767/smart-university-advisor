# =============================================================================
# chatbot.py  —  Advanced Agentic RAG Chatbot for Smart University Advisor
# =============================================================================
# Features:
#   - RAG (Retrieval-Augmented Generation) using ChromaDB + HuggingFace
#   - Agentic: detects student intent and calls Node.js API automatically
#   - Actions: submit leave, academic, exam, other queries; book appointments;
#              check query/appointment status on behalf of student
#   - Conversation memory (last 10 turns)
#   - Groq LLM (llama-3.3-70b) for fast, free inference
# =============================================================================

import os
import json
import re
import httpx
from datetime import date, timedelta
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# Node.js/Express backend base URL
NODE_API_URL = os.getenv("NODE_API_URL", "http://localhost:5000/api")


# ── Date helpers ──────────────────────────────────────────────────────────────
def today_str():
    return date.today().isoformat()

def tomorrow_str():
    return (date.today() + timedelta(days=1)).isoformat()


# ── System prompt builder ─────────────────────────────────────────────────────
def build_system_prompt(context, student):
    name = f"{student.get('firstName', '')} {student.get('lastName', '')}".strip() or "Student"
    sid  = student.get("studentId", "N/A")

    return f"""You are an intelligent AI assistant for a university student portal.
You help students with academic queries, leave applications, appointment booking, and general university information.

Current student: {name}  (ID: {sid})
Today's date  : {today_str()}

University knowledge base (use this to answer policy/info questions):
---
{context}
---

========== AVAILABLE ACTIONS ==========
When the student wants to DO something, output an ACTION tag at the END of your reply.

Submit sick/casual/urgent/marriage/emergency leave:
<ACTION>{{"tool":"submit_leave_query","params":{{"leaveType":"sick","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","description":"reason"}}}}</ACTION>

Submit course add/drop or freeze:
<ACTION>{{"tool":"submit_academic_query","params":{{"queryType":"add-drop","courseName":"Math101","description":"reason"}}}}</ACTION>

Submit exam retake or marks update:
<ACTION>{{"tool":"submit_exam_query","params":{{"queryType":"mid-retake","courseName":"Math101","examType":"mid","description":"reason"}}}}</ACTION>

Submit attendance or timetable issue:
<ACTION>{{"tool":"submit_other_query","params":{{"issueType":"attendance","description":"reason"}}}}</ACTION>

Book advisor appointment:
<ACTION>{{"tool":"book_appointment","params":{{"appointmentType":"academic","preferredDate":"YYYY-MM-DD","preferredTime":"10:00","reason":"reason"}}}}</ACTION>

Check submitted queries:
<ACTION>{{"tool":"check_queries","params":{{}}}}</ACTION>

Check booked appointments:
<ACTION>{{"tool":"check_appointments","params":{{}}}}</ACTION>

========== RULES ==========
1. INTENT DETECTION — this is critical:
   - If the student asks HOW to do something, or asks for INFORMATION/GUIDANCE
     (e.g. "how do I book", "what is the process", "tell me about", "explain", "?")
     → answer with explanation ONLY. DO NOT output an ACTION tag.
   - If the student explicitly says DO IT / BOOK IT / SUBMIT IT / FOR ME
     (e.g. "book an appointment for me", "apply for sick leave", "submit a query")
     → collect params and output the ACTION tag.
   - When in doubt, ask: "Would you like me to explain the process, or shall I do it for you?"

2. Extract ALL required parameters from the conversation before acting.
   If any required param is missing, ask the student for it first.
3. Confirm what you are about to do in plain English, THEN append the ACTION tag.
4. Valid leaveTypes       : sick | casual | urgent | marriage | emergency
5. Valid appointmentTypes : academic | course | career | personal | counseling
6. Valid examTypes        : mid | final | quiz | assignment | other
7. Valid academic queryTypes: add-drop | freeze-course
8. All dates must be YYYY-MM-DD format.
9. Be friendly, concise, and professional.
10. Never invent information not in the knowledge base.
"""


# ── Action parser helpers ─────────────────────────────────────────────────────
def parse_action(text):
    match = re.search(r"<ACTION>([\s\S]*?)</ACTION>", text)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return None

def strip_action(text):
    return re.sub(r"<ACTION>[\s\S]*?</ACTION>", "", text).strip()


# ── Action executor — calls Node.js Express API ───────────────────────────────
class ActionExecutor:
    def __init__(self, token=None):
        self.token = token
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}

    async def execute(self, tool, params):
        async with httpx.AsyncClient(timeout=15.0) as client:

            if tool == "submit_leave_query":
                data = {
                    "queryType"  : params.get("leaveType", "sick") + "-leave",
                    "description": params.get("description", "Leave request via AI assistant"),
                    "leaveType"  : params.get("leaveType", "sick"),
                    "startDate"  : params.get("startDate", today_str()),
                    "endDate"    : params.get("endDate", tomorrow_str()),
                    "priority"   : "medium",
                }
                r = await client.post(f"{NODE_API_URL}/students/queries/leave",
                                      data=data, headers=self.headers)
                r.raise_for_status()
                return r.json()

            elif tool == "submit_academic_query":
                data = {
                    "queryType"  : params.get("queryType", "add-drop"),
                    "description": params.get("description", "Academic query via AI assistant"),
                    "courseName" : params.get("courseName", ""),
                    "courseCode" : params.get("courseCode", ""),
                    "priority"   : "medium",
                }
                r = await client.post(f"{NODE_API_URL}/students/queries/academic",
                                      data=data, headers=self.headers)
                r.raise_for_status()
                return r.json()

            elif tool == "submit_exam_query":
                data = {
                    "queryType"  : params.get("queryType", "mid-retake"),
                    "description": params.get("description", "Exam query via AI assistant"),
                    "courseName" : params.get("courseName", ""),
                    "examType"   : params.get("examType", "mid"),
                    "priority"   : "medium",
                }
                r = await client.post(f"{NODE_API_URL}/students/queries/exam",
                                      data=data, headers=self.headers)
                r.raise_for_status()
                return r.json()

            elif tool == "submit_other_query":
                data = {
                    "queryType"  : params.get("issueType", "other"),
                    "description": params.get("description", "Other query via AI assistant"),
                    "issueType"  : params.get("issueType", "other"),
                    "priority"   : "medium",
                }
                r = await client.post(f"{NODE_API_URL}/students/queries/other",
                                      data=data, headers=self.headers)
                r.raise_for_status()
                return r.json()

            elif tool == "book_appointment":
                payload = {
                    "appointmentType": params.get("appointmentType", "academic"),
                    "preferredDate"  : params.get("preferredDate", tomorrow_str()),
                    "preferredTime"  : params.get("preferredTime", "10:00"),
                    "reason"         : params.get("reason", "Booked via AI assistant"),
                }
                r = await client.post(
                    f"{NODE_API_URL}/students/appointments",
                    json=payload,
                    headers={**self.headers, "Content-Type": "application/json"}
                )
                r.raise_for_status()
                return r.json()

            elif tool == "check_queries":
                r = await client.get(f"{NODE_API_URL}/students/queries/my-queries",
                                     headers=self.headers)
                r.raise_for_status()
                return r.json()

            elif tool == "check_appointments":
                r = await client.get(f"{NODE_API_URL}/students/appointments/my-appointments",
                                     headers=self.headers)
                r.raise_for_status()
                return r.json()

            else:
                raise ValueError(f"Unknown tool: {tool}")

    def format_result(self, tool, result):
        if tool == "check_queries":
            queries = result.get("queries", [])
            if not queries:
                return "You have no submitted queries yet."
            lines = ["Here are your recent queries:"]
            for q in queries[:5]:
                lines.append(
                    f"  - {q.get('queryType','query')} | "
                    f"Status: {q.get('finalStatus','unknown').upper()} | "
                    f"Submitted: {str(q.get('createdAt',''))[:10]}"
                )
            return "\n".join(lines)

        if tool == "check_appointments":
            apts = result.get("appointments", [])
            if not apts:
                return "You have no booked appointments yet."
            lines = ["Here are your appointments:"]
            for a in apts[:5]:
                lines.append(
                    f"  - {a.get('appointmentType','appointment')} | "
                    f"{str(a.get('preferredDate',''))[:10]} at {a.get('preferredTime','')} | "
                    f"Status: {a.get('status','unknown').upper()}"
                )
            return "\n".join(lines)

        if tool == "book_appointment":
            return ("Appointment booked successfully! "
                    "Your advisor will confirm it shortly. "
                    "Track it under 'My Appointments' on your dashboard.")

        return ("Request submitted successfully! "
                "Track it under 'My Queries' on your dashboard.")


# ── Main chatbot class ────────────────────────────────────────────────────────
class WebsiteRAGChatbot:
    def __init__(self, groq_api_key, document_path):
        self.client        = Groq(api_key=groq_api_key)
        self.model_name    = "llama-3.3-70b-versatile"
        self.document_path = document_path
        self.vectorstore   = None
        self.conversation_history = []   # list of {role, content}

        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        print("Agentic RAG Chatbot initialized with Groq!")

    # ── Document loading ──────────────────────────────────────────────────────
    def load_and_process_document(self):
        print("\nLoading document...")
        try:
            with open(self.document_path, "r", encoding="utf-8") as f:
                content = f.read()
            print(f"Loaded {len(content)} characters")
        except FileNotFoundError:
            print(f"Error: {self.document_path} not found")
            return False

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500, chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        chunks    = splitter.split_text(content)
        documents = [Document(page_content=c) for c in chunks]

        print("Building vector database...")
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory="./chroma_db"
        )
        print(f"Vector database ready ({len(chunks)} chunks)")
        return True

    def load_existing_db(self):
        print("\nLoading existing vector database from ./chroma_db...")
        self.vectorstore = Chroma(
            persist_directory="./chroma_db",
            embedding_function=self.embeddings
        )
        print("Existing vector database loaded successfully.")
        return True

    # ── RAG retrieval ─────────────────────────────────────────────────────────
    def retrieve_context(self, query, top_k=3):
        if not self.vectorstore:
            return ""
        docs = self.vectorstore.similarity_search(query, k=top_k)
        return "\n\n".join(d.page_content for d in docs)

    # ── Build messages array ──────────────────────────────────────────────────
    def _build_messages(self, query, student):
        context = self.retrieve_context(query)
        system  = build_system_prompt(context, student)

        messages = [{"role": "system", "content": system}]
        for turn in self.conversation_history[-10:]:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": query})
        return messages

    # ── Streaming (used by app.py FastAPI endpoint) ───────────────────────────
    def stream_response(self, query, student=None):
        """
        Yields text chunks for streaming.
        After all chunks, if an ACTION was detected, yields:
            __ACTION__<json>
        so that app.py can execute it and stream the result back.
        """
        student  = student or {}
        messages = self._build_messages(query, student)

        stream = self.client.chat.completions.create(
            messages=messages,
            model=self.model_name,
            stream=True,
            temperature=0.7,
            max_tokens=1024,
        )

        full_text = ""
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                full_text += delta
                yield delta

        # Save to conversation memory
        display = strip_action(full_text)
        self.conversation_history.append({"role": "user",      "content": query})
        self.conversation_history.append({"role": "assistant", "content": display})

        # Signal action if present
        action = parse_action(full_text)
        if action:
            yield f"\n__ACTION__{json.dumps(action)}"

    # ── Non-streaming (for CLI testing) ──────────────────────────────────────
    def chat(self, user_query, student=None):
        student  = student or {}
        messages = self._build_messages(user_query, student)

        resp   = self.client.chat.completions.create(
            messages=messages,
            model=self.model_name,
            temperature=0.7,
            max_tokens=1024,
        )
        answer  = resp.choices[0].message.content
        display = strip_action(answer)

        self.conversation_history.append({"role": "user",      "content": user_query})
        self.conversation_history.append({"role": "assistant", "content": display})

        return answer  # includes ACTION tag so caller can parse it

    def save_conversation(self, filename="conversation_history.json"):
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.conversation_history, f, indent=2, ensure_ascii=False)
        print(f"Conversation saved to {filename}")


# ── CLI entry point for quick testing ────────────────────────────────────────
async def cli_main():
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not set in .env")
        return

    bot = WebsiteRAGChatbot(groq_api_key=GROQ_API_KEY, document_path="website_info.txt")
    if not bot.load_and_process_document():
        return

    student  = {"firstName": "Test", "lastName": "Student", "studentId": "2021-CS-001"}
    executor = ActionExecutor(token=None)

    print("\nAgentic Chatbot ready! Type 'quit' to exit.\n")

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("quit", "exit", "q"):
                bot.save_conversation()
                break

            response = bot.chat(user_input, student=student)
            display  = strip_action(response)
            print(f"\nAssistant: {display}\n")

            action = parse_action(response)
            if action:
                tool   = action.get("tool", "")
                params = action.get("params", {})
                print(f"[Agent] Running: {tool} {params}")
                try:
                    result = await executor.execute(tool, params)
                    print(f"[Agent] {executor.format_result(tool, result)}\n")
                except Exception as e:
                    print(f"[Agent] Failed: {e}\n")

        except KeyboardInterrupt:
            bot.save_conversation()
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(cli_main())
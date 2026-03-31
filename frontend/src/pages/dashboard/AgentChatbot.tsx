/**
 * AgentChatbot.tsx — Conversational Agentic Student Assistant
 *
 * Collects ALL required form fields through conversation before submitting.
 * Understands student mood:
 *   - "How do I..." → guidance (RAG explanation)
 *   - "Book/Submit/Apply for me" → conversational form collection → API call
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, X, Send, Mic, MicOff, Volume2, VolumeX,
  Loader2, CheckCircle, AlertCircle, Calendar,
  FileText, Sparkles, Info, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  firstName?: string;
  lastName?: string;
  studentId?: string;
}
interface AgentChatbotProps {
  user: User | null;
  onClose: () => void;
  token: string | null;
  onAppointmentBooked?: () => void;  // refresh dashboard appointments list
  onQuerySubmitted?: () => void;     // refresh dashboard queries list
}
interface ChatMessage {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  mode?: "guidance" | "action" | "info";
  actionStatus?: { tool: string; status: "loading" | "success" | "error" } | null;
}
interface HistoryEntry { role: "user" | "assistant"; content: string; }

// Collected form data during conversation
interface FormData {
  // appointment
  appointmentType?: string;
  preferredDate?: string;
  preferredTime?: string;
  reason?: string;
  // leave
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  // academic / exam
  courseName?: string;
  courseCode?: string;
  examType?: string;
  currentMarks?: string;
  // other
  issueType?: string;
  // shared
  description?: string;
  queryType?: string;
}

// Active conversation flow state
interface FlowState {
  tool: string;          // which action we are collecting for
  step: string;          // current question being asked
  data: FormData;        // collected so far
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; }

// ── Constants ─────────────────────────────────────────────────────────────────
const AGENT_URL = "http://localhost:8000/api/chat/agent";
const NODE_API  = (import.meta as unknown as { env: Record<string, string> }).env
  ?.VITE_REACT_APP_API_URL ?? "http://localhost:5000/api";

const todayStr    = () => new Date().toISOString().split("T")[0];
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };

// ── Flow definitions — what questions to ask for each action ──────────────────
// Each step: { key: field name, question: what to ask, options?: choices }
const FLOWS: Record<string, Array<{ key: keyof FormData; question: string; spoken?: string; options?: string[]; optional?: boolean }>> = {
  book_appointment: [
    { key: "appointmentType", question: "What type of appointment would you like?\n1️⃣ Academic Counseling\n2️⃣ Course Guidance\n3️⃣ Career Advice\n4️⃣ Personal Issue\n\nReply with the number or name.", spoken: "What type of appointment would you like? Academic, Course, Career, or Personal?", options: ["academic","course","career","personal"] },
    { key: "preferredDate",   question: "What date would you prefer? (format: YYYY-MM-DD, e.g. 2025-12-20)", spoken: "What date would you prefer?" },
    { key: "preferredTime",   question: "What time would you prefer? (format: HH:MM, e.g. 10:00 or 14:30)", spoken: "What time would you prefer?" },
    { key: "reason",          question: "Briefly describe the reason for your appointment:", spoken: "Please briefly describe the reason for your appointment." },
  ],
  submit_leave_query: [
    { key: "leaveType",   question: "What type of leave?\n1️⃣ Sick Leave\n2️⃣ Marriage Leave\n3️⃣ Urgent Leave\n\nReply with number or name.", spoken: "What type of leave? Sick, Marriage, or Urgent?", options: ["sick","marriage","urgent"] },
    { key: "startDate",   question: "What is the start date of your leave? (YYYY-MM-DD)", spoken: "What is the start date of your leave?" },
    { key: "endDate",     question: "What is the end date of your leave? (YYYY-MM-DD)", spoken: "What is the end date of your leave?" },
    { key: "description", question: "Please provide a brief reason for your leave:", spoken: "Please provide a brief reason for your leave." },
  ],
  submit_academic_query: [
    { key: "queryType",   question: "What type of academic query?\n1️⃣ Add/Drop Course\n2️⃣ Freeze Course\n\nReply with number or name.", spoken: "What type of academic query? Add or drop a course, or freeze a course?", options: ["add-drop","freeze-course"] },
    { key: "courseName",  question: "What is the course name? (e.g. Data Structures)", spoken: "What is the course name?" },
    { key: "courseCode",  question: "What is the course code? (e.g. CS-201, or type 'skip' to skip)", spoken: "What is the course code? You may skip this if you don't know it.", optional: true },
    { key: "description", question: "Please describe your request in detail:", spoken: "Please describe your request." },
  ],
  submit_exam_query: [
    { key: "queryType",     question: "What type of exam query?\n1️⃣ Retake Request\n2️⃣ Marks Update\n\nReply with number or name.", spoken: "What type of exam query? A retake request, or a marks update?", options: ["retake","update-marks"] },
    { key: "courseName",    question: "Which course is this for? (e.g. Data Structures)", spoken: "Which course is this for?" },
    { key: "courseCode",    question: "Course code? (e.g. CS-201, or type 'skip' to skip)", spoken: "What is the course code? You may skip this.", optional: true },
    { key: "examType",      question: "Which exam type?\n1️⃣ Midterm\n2️⃣ Final\n3️⃣ Quiz\n\nReply with number or name.", spoken: "Which exam type? Midterm, Final, or Quiz?", options: ["mid","final","quiz"] },
    { key: "currentMarks",  question: "What are your current marks? (e.g. 45, or type 'skip' to skip)", spoken: "What are your current marks? You may skip this.", optional: true },
    { key: "description",   question: "Please describe your issue in detail:", spoken: "Please describe your issue." },
  ],
  submit_other_query: [
    { key: "issueType",   question: "What type of issue?\n1️⃣ Attendance Issue\n2️⃣ Timetable Issue\n3️⃣ Other\n\nReply with number or name.", spoken: "What type of issue? Attendance, Timetable, or Other?", options: ["attendance","timetable","other"] },
    { key: "description", question: "Please describe your issue in detail:", spoken: "Please describe your issue." },
  ],
};

// Map shorthand / number answers to actual values
function resolveOption(input: string, options: string[]): string {
  const t = input.toLowerCase().trim();
  // Number answer
  const num = parseInt(t);
  if (!isNaN(num) && num >= 1 && num <= options.length) return options[num - 1];
  // Partial match
  const match = options.find(o => t.includes(o) || o.includes(t));
  return match ?? t;
}

// ── Intent classifier ─────────────────────────────────────────────────────────
type IntentMode = "guidance" | "action" | "info";

function classifyIntent(text: string): { mode: IntentMode; tool: string | null } {
  const t = text.toLowerCase().trim();

  // ── Guidance patterns — checked FIRST so "how do I book" stays guidance ──
  const guidancePatterns = [
    /^how (do|can|to|should)/,
    /^what (is|are|the steps|process|procedure)/,
    /^tell me (about|how)/,
    /^explain/,
    /^guide/,
    /steps to/,
    /procedure for/,
    /\?\s*$/,                        // ends with question mark
    /\bdeadline\b/,
    /\bpolicy\b/,
    /\brules? (for|about)\b/,
    /\binformation (about|on)\b/,
    /\bwhat happens\b/,
    /\bwhen (can|should|do|is)\b/,
    /\bwhy (do|should|is)\b/,
    /\bwhere (do|can|should)\b/,
    /\bcan you (explain|tell|describe|show)\b/,
    /\bprovide (guidance|information|details)\b/,
  ];
  const isGuidance = guidancePatterns.some(p => p.test(t));

  // If guidance pattern matched, NEVER trigger an action — return guidance immediately
  if (isGuidance) return { mode: "guidance", tool: null };

  // ── Action patterns — only reached when NO guidance pattern matched ──────
  // Require explicit "do it for me" phrasing for actions to avoid false triggers

  // Appointment — must have strong action verb + explicit intent
  if (t.match(/\b(book|schedule|set up|arrange)\b.*(appointment|meeting)/) && !isGuidance)
    return { mode: "action", tool: "book_appointment" };
  if (t.match(/\bbook (me|for me|it|an? appointment)\b/))
    return { mode: "action", tool: "book_appointment" };
  if (t.match(/appointment.*(for me|please book|book it)/))
    return { mode: "action", tool: "book_appointment" };

  // Leave
  if (t.match(/\b(apply|submit|request)\b.*(leave)/) || t.match(/\b(sick|casual|urgent|marriage|emergency) leave\b.*\b(for me|please|submit|apply)\b/))
    return { mode: "action", tool: "submit_leave_query" };
  if (t.match(/^apply (for |a )?(sick|casual|urgent|marriage|emergency) leave/))
    return { mode: "action", tool: "submit_leave_query" };

  // Academic
  if (t.match(/(drop|add|freeze).*(course|subject)|(course|subject).*(drop|add|freeze)|add.?drop/))
    return { mode: "action", tool: "submit_academic_query" };

  // Exam
  if (t.match(/(retake|re.?take|update|fix|correct).*(exam|marks?|mid|final|quiz)|marks?.*(update|issue|wrong)/))
    return { mode: "action", tool: "submit_exam_query" };

  // Other
  if (t.match(/(report|submit|raise).*(attendance|timetable)|(attendance|timetable).*(issue|problem)/))
    return { mode: "action", tool: "submit_other_query" };

  // Check status
  if (t.match(/check.*(quer|appoint|status)|show.*(quer|appoint)|my.*(quer|appoint)/))
    return { mode: "action", tool: t.match(/appoint/) ? "check_appointments" : "check_queries" };

  // Generic action signals
  if (t.match(/\bfor me\b|\bdo it\b|\bgo ahead\b|please (book|submit|apply|check|drop|add)/))
    return { mode: "action", tool: null };

  return { mode: "info", tool: null };
}

// ── API executor ──────────────────────────────────────────────────────────────
async function executeAction(tool: string, data: FormData, token: string | null): Promise<unknown> {
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const postForm = async (url: string, fields: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(fields).filter(([,v]) => v).forEach(([k,v]) => fd.append(k,v));
    const r = await fetch(url, { method: "POST", headers: auth, body: fd });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return r.json();
  };
  const postJson = async (url: string, body: Record<string, string>) => {
    const r = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json",...auth}, body:JSON.stringify(body) });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return r.json();
  };
  const getJson = async (url: string) => {
    const r = await fetch(url, { headers: auth });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return r.json();
  };

  switch (tool) {
    case "book_appointment":
      return postJson(`${NODE_API}/students/appointments`, {
        appointmentType: data.appointmentType ?? "academic",
        preferredDate:   data.preferredDate   ?? tomorrowStr(),
        preferredTime:   data.preferredTime   ?? "10:00",
        reason:          data.reason          ?? "Booked via AI",
      });
    case "submit_leave_query":
      return postForm(`${NODE_API}/students/queries/leave`, {
        queryType:   (data.leaveType ?? "sick") + "-leave",
        leaveType:   data.leaveType   ?? "sick",
        startDate:   data.startDate   ?? todayStr(),
        endDate:     data.endDate     ?? tomorrowStr(),
        description: data.description ?? "Leave via AI",
        priority:    "medium",
      });
    case "submit_academic_query":
      return postForm(`${NODE_API}/students/queries/academic`, {
        queryType:   data.queryType   ?? "add-drop",
        courseName:  data.courseName  ?? "",
        courseCode:  data.courseCode  ?? "",
        description: data.description ?? "Academic query via AI",
        priority:    "medium",
      });
    case "submit_exam_query":
      return postForm(`${NODE_API}/students/queries/exam`, {
        queryType:    data.queryType    ?? "retake",
        courseName:   data.courseName   ?? "",
        courseCode:   data.courseCode   ?? "",
        examType:     data.examType     ?? "mid",
        currentMarks: data.currentMarks ?? "",
        description:  data.description  ?? "Exam query via AI",
        priority:     "medium",
      });
    case "submit_other_query":
      return postForm(`${NODE_API}/students/queries/other`, {
        queryType:   data.issueType   ?? "other",
        issueType:   data.issueType   ?? "other",
        description: data.description ?? "Other query via AI",
        priority:    "medium",
      });
    case "check_queries":
      return getJson(`${NODE_API}/students/queries/my-queries`);
    case "check_appointments":
      return getJson(`${NODE_API}/students/appointments/my-appointments`);
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

function formatResult(tool: string, result: unknown): string {
  const r = result as Record<string, unknown>;
  if (tool === "check_queries") {
    const qs = (r?.queries as Array<Record<string,string>>) ?? [];
    if (!qs.length) return "📭 You have no submitted queries yet.";
    return "📋 **Your Recent Queries:**\n" + qs.slice(0,5).map(q =>
      `• **${q.queryType}** — ${(q.finalStatus??"pending").toUpperCase()} (${(q.createdAt??"").slice(0,10)})`
    ).join("\n");
  }
  if (tool === "check_appointments") {
    const as_ = (r?.appointments as Array<Record<string,string>>) ?? [];
    if (!as_.length) return "📭 You have no appointments yet.";
    return "📅 **Your Appointments:**\n" + as_.slice(0,5).map(a =>
      `• **${a.appointmentType}** on ${(a.preferredDate??"").slice(0,10)} at ${a.preferredTime??""} — ${(a.status??"pending").toUpperCase()}`
    ).join("\n");
  }
  if (tool === "book_appointment")
    return "✅ **Appointment booked successfully!** Your advisor will confirm it shortly.\nTrack it under **My Appointments** on the dashboard.";
  return "✅ **Request submitted successfully!** Track it under **My Queries** on your dashboard.";
}

// ── Summary before submitting ─────────────────────────────────────────────────
function buildSummary(tool: string, data: FormData): string {
  switch (tool) {
    case "book_appointment":
      return `📋 **Booking Summary:**\n• Type: ${data.appointmentType}\n• Date: ${data.preferredDate}\n• Time: ${data.preferredTime}\n• Reason: ${data.reason}\n\nShall I confirm and book this? (yes / no)`;
    case "submit_leave_query":
      return `📋 **Leave Request Summary:**\n• Leave Type: ${data.leaveType}\n• From: ${data.startDate}\n• To: ${data.endDate}\n• Reason: ${data.description}\n\nShall I submit this? (yes / no)`;
    case "submit_academic_query":
      return `📋 **Academic Query Summary:**\n• Type: ${data.queryType}\n• Course: ${data.courseName}${data.courseCode ? ` (${data.courseCode})` : ""}\n• Details: ${data.description}\n\nShall I submit this? (yes / no)`;
    case "submit_exam_query":
      return `📋 **Exam Query Summary:**\n• Type: ${data.queryType}\n• Course: ${data.courseName}${data.courseCode ? ` (${data.courseCode})` : ""}\n• Exam: ${data.examType}${data.currentMarks ? `\n• Marks: ${data.currentMarks}` : ""}\n• Details: ${data.description}\n\nShall I submit this? (yes / no)`;
    case "submit_other_query":
      return `📋 **Issue Query Summary:**\n• Issue Type: ${data.issueType}\n• Details: ${data.description}\n\nShall I submit this? (yes / no)`;
    default:
      return "Ready to submit. Confirm? (yes / no)";
  }
}

// ── Guidance fetch from Python RAG ────────────────────────────────────────────
async function fetchGuidance(text: string, user: User | null, history: HistoryEntry[], token: string | null): Promise<string> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 12000);
    const res = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text, student: { firstName: user?.firstName, lastName: user?.lastName, studentId: user?.studentId }, token, history: history.slice(-6) }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) return "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text2 = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.includes("__ACTION__")) break;
      text2 += chunk;
    }
    return text2.trim();
  } catch { return ""; }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ModeTag({ mode }: { mode?: string }) {
  if (!mode || mode === "info") return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
      mode === "guidance" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
    }`}>
      {mode === "guidance" ? <><Info className="w-2.5 h-2.5"/>Guidance</> : <><Zap className="w-2.5 h-2.5"/>Action</>}
    </span>
  );
}

function MessageText({ content }: { content: string }) {
  return (
    <div className="space-y-1">
      {content.split("\n").map((line, i) => (
        <p key={i} className="leading-relaxed">
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j}>{part.slice(2,-2)}</strong>
              : part
          )}
        </p>
      ))}
    </div>
  );
}

function ActionCard({ tool, status }: { tool: string; status: "loading"|"success"|"error" }) {
  const Icon = ["book_appointment","check_appointments"].includes(tool) ? Calendar : FileText;
  const label = tool.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase());
  const cls = { loading:"bg-blue-50 border-blue-200 text-blue-700", success:"bg-emerald-50 border-emerald-200 text-emerald-700", error:"bg-red-50 border-red-200 text-red-700" }[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mt-1 border ${cls}`}>
      {status==="loading"?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:status==="success"?<CheckCircle className="w-3.5 h-3.5"/>:<AlertCircle className="w-3.5 h-3.5"/>}
      <Icon className="w-3.5 h-3.5"/>
      <span>{label}</span>
      <span className="opacity-60">{status==="loading"?"processing…":status==="success"?"done ✓":"failed"}</span>
    </div>
  );
}

// ── Suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS_GUIDANCE = ["How do I book an appointment?","What is the leave application process?","How to request a course drop?","How to apply for exam retake?"];
const SUGGESTIONS_ACTION   = ["Book appointment for me","Apply for sick leave","Drop a course for me","Submit attendance issue","Check my query status"];

// ── Main component ────────────────────────────────────────────────────────────
export default function AgentChatbot({ user, onClose, token, onAppointmentBooked, onQuerySubmitted }: AgentChatbotProps) {
  const [messages, setMessages]         = useState<ChatMessage[]>([{
    id: "welcome", role: "assistant", mode: "info",
    content: `Hi ${user?.firstName ?? "there"}! 👋 I'm your smart AI assistant.\n\n🟡 **Ask "How do I..."** → I'll explain step by step\n🟢 **Say "Book/Submit for me"** → I'll collect all details and do it!\n\nWhat would you like?`,
  }]);
  const [input, setInput]               = useState("");
  const [isTyping, setIsTyping]         = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [flow, setFlow]                 = useState<FlowState | null>(null);  // active collection flow
  const [showSuggestions, setShowSuggestions] = useState(true);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef       = useRef<SpeechSynthesis | null>(typeof window !== "undefined" ? window.speechSynthesis : null);
  const handleSendRef  = useRef<(t?: string) => Promise<void>>(async () => {});

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length-1].isFinal) { setIsListening(false); handleSendRef.current(t); }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
  }, []); // eslint-disable-line

  // Smart TTS cleaner — converts raw text to natural spoken language
  const cleanForSpeech = useCallback((text: string): string => {
    return text
      // strip format hints like "(format: YYYY-MM-DD, e.g. 2025-12-20)" entirely
      .replace(/\(format:[^)]*\)/gi, "")
      // strip "e.g. ..." examples in parentheses
      .replace(/\(e\.g\.[^)]*\)/gi, "")
      // strip "or type 'skip' to skip" phrases
      .replace(/,?\s*or type ['"]?skip['"]? to skip/gi, "")
      // strip "_( ... )_" optional hints
      .replace(/_\([^)]*\)_/g, "")
      // strip numbered list emoji like 1️⃣ 2️⃣ 3️⃣ — replace with natural pause
      .replace(/[1-9]️⃣/g, "")
      // strip markdown bold
      .replace(/\*\*/g, "")
      // strip emoji / bullet symbols
      .replace(/[•📋📅✅❌📭🟡🟢⏳⚙️💡🔊📝🎤]/g, "")
      // YYYY-MM-DD → "Month Day Year"
      .replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y, m, d) => {
        const months = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];
        const mo = months[parseInt(m, 10) - 1] ?? m;
        return `${mo} ${parseInt(d, 10)}, ${y}`;
      })
      // HH:MM 24h → "H AM/PM" natural form
      .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, min) => {
        const hour = parseInt(h, 10);
        const suffix = hour < 12 ? "AM" : "PM";
        const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return min === "00" ? `${h12} ${suffix}` : `${h12}:${min} ${suffix}`;
      })
      // remove leftover markdown symbols
      .replace(/[#_`~>|]/g, "")
      // collapse multiple spaces/newlines
      .replace(/\n+/g, ". ")
      .replace(/  +/g, " ")
      .replace(/\.{2,}/g, ".")
      .trim()
      // cap length — TTS sounds bad when too long
      .slice(0, 450);
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const clean = cleanForSpeech(text);
    if (!clean) return;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate  = 0.95;
    utt.pitch = 1.0;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utt);
  }, [voiceEnabled, cleanForSpeech]);

  const addMsg = useCallback((msg: Omit<ChatMessage,"id">) => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { ...msg, id }]);
    return id;
  }, []);

  const updateMsg = useCallback((id: number|string, patch: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  // ── FLOW: advance to next question or submit ──────────────────────────────
  const advanceFlow = useCallback(async (currentFlow: FlowState, userAnswer: string) => {
    const steps = FLOWS[currentFlow.tool];
    if (!steps) return;

    const currentStepIdx = steps.findIndex(s => s.key === currentFlow.step);
    const currentStep    = steps[currentStepIdx];

    // Parse the answer
    let value = userAnswer.trim();
    if (value.toLowerCase() === "skip" && currentStep?.optional) value = "";

    // Resolve option shortcuts (numbers/partials)
    if (currentStep?.options && value) {
      value = resolveOption(value, currentStep.options);
    }

    // Save answer to data
    const newData: FormData = { ...currentFlow.data };
    if (currentStep && value) {
      (newData as Record<string, string>)[currentStep.key] = value;
    }

    // Find next step
    const nextStep = steps[currentStepIdx + 1];

    if (nextStep) {
      // Ask next question
      const newFlow: FlowState = { ...currentFlow, step: nextStep.key, data: newData };
      setFlow(newFlow);
      const q = nextStep.optional ? nextStep.question + "\n_(or type **skip** to skip)_" : nextStep.question;
      addMsg({ role: "assistant", mode: "action", content: q });
      speak(nextStep.spoken ?? nextStep.question);
    } else {
      // All data collected — show summary for confirmation
      setFlow({ ...currentFlow, step: "__confirm__", data: newData });
      const summary = buildSummary(currentFlow.tool, newData);
      addMsg({ role: "assistant", mode: "action", content: summary });
      speak("Please review the details and confirm.");
    }
  }, [addMsg, speak]);

  // ── FLOW: handle confirmation (yes/no) ────────────────────────────────────
  const handleConfirmation = useCallback(async (answer: string, currentFlow: FlowState) => {
    const t = answer.toLowerCase().trim();
    const isYes = t.match(/^(yes|y|ok|confirm|sure|go ahead|proceed|submit|book|yep|yeah)/);
    const isNo  = t.match(/^(no|n|cancel|stop|abort|nope|don't|do not)/);

    if (isYes) {
      setFlow(null);
      const confirmId = addMsg({ role:"assistant", mode:"action", content:`⏳ Processing your request…`, actionStatus:{ tool: currentFlow.tool, status:"loading" } });
      try {
        const result = await executeAction(currentFlow.tool, currentFlow.data, token);
        const text   = formatResult(currentFlow.tool, result);
        updateMsg(confirmId, { content: text, actionStatus:{ tool: currentFlow.tool, status:"success" } });
        speak(text);
        setHistory(prev => [...prev, { role:"assistant", content: text }]);
        // Refresh the appropriate dashboard list after successful action
        if (currentFlow.tool === "book_appointment") {
          onAppointmentBooked?.();
        } else if (["submit_leave_query","submit_academic_query","submit_exam_query","submit_other_query"].includes(currentFlow.tool)) {
          onQuerySubmitted?.();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        updateMsg(confirmId, {
          content: `❌ Failed to complete your request.\n**Error:** ${msg}\n\nPlease try again or use the dashboard directly.`,
          actionStatus: { tool: currentFlow.tool, status:"error" },
        });
      }
    } else if (isNo) {
      setFlow(null);
      addMsg({ role:"assistant", mode:"info", content:"No problem! Your request has been cancelled. Is there anything else I can help you with?" });
    } else {
      addMsg({ role:"assistant", mode:"action", content:"Please reply with **yes** to confirm and submit, or **no** to cancel." });
    }
  }, [addMsg, updateMsg, token, speak]);

  // ── Core send ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isTyping) return;
    setInput("");
    setShowSuggestions(false);

    addMsg({ role:"user", content: text });
    setHistory(prev => [...prev, { role:"user", content: text }]);
    setIsTyping(true);

    // ── If we're in a flow, process the answer ─────────────────────────────
    if (flow) {
      if (flow.step === "__confirm__") {
        await handleConfirmation(text, flow);
      } else {
        await advanceFlow(flow, text);
      }
      setIsTyping(false);
      return;
    }

    // ── Classify fresh intent ──────────────────────────────────────────────
    const { mode, tool } = classifyIntent(text);

    if (mode === "action" && tool && FLOWS[tool]) {
      // ── Start a collection flow ──────────────────────────────────────────
      const firstStep = FLOWS[tool][0];
      const newFlow: FlowState = { tool, step: firstStep.key, data: {} };
      setFlow(newFlow);
      const intro = getActionIntro(tool);
      addMsg({ role:"assistant", mode:"action", content: intro });
      setTimeout(() => {
        const q = firstStep.optional ? firstStep.question + "\n_(or type **skip** to skip)_" : firstStep.question;
        addMsg({ role:"assistant", mode:"action", content: q });
        speak(firstStep.spoken ?? firstStep.question);
      }, 300);

    } else if (mode === "action" && (tool === "check_queries" || tool === "check_appointments")) {
      // ── Direct check — no form needed ───────────────────────────────────
      const confirmId = addMsg({ role:"assistant", mode:"action", content:"Fetching your data…", actionStatus:{ tool: tool!, status:"loading" } });
      try {
        const result = await executeAction(tool!, {}, token);
        const txt    = formatResult(tool!, result);
        updateMsg(confirmId, { content: txt, actionStatus:{ tool: tool!, status:"success" } });
        speak(txt);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        updateMsg(confirmId, { content:`❌ Couldn't fetch data: ${msg}`, actionStatus:{ tool: tool!, status:"error" } });
      }

    } else if (mode === "action" && !tool) {
      // ── Action intent but unclear tool — ask what they want ──────────────
      addMsg({ role:"assistant", mode:"info", content:"I'd love to help! What would you like me to do?\n\n1️⃣ Book an appointment\n2️⃣ Submit leave query\n3️⃣ Submit academic query (add/drop/freeze)\n4️⃣ Submit exam query (retake/marks)\n5️⃣ Submit other issue (attendance/timetable)\n6️⃣ Check my query status\n\nReply with number or describe what you need." });

    } else {
      // ── Guidance or general info — ask Python RAG ────────────────────────
      const assistantId = addMsg({ role:"assistant", mode: mode === "guidance" ? "guidance" : "info", content:"", actionStatus: null });
      const response = await fetchGuidance(text, user, history, token);

      const finalText = response || (
        mode === "guidance"
          ? "I couldn't reach the knowledge base right now. Make sure the Python server is running on port 8000.\n\nFor guidance, please contact your advisor or visit the university portal."
          : "I'm not sure what you mean. Try asking:\n• **\"How do I book an appointment?\"** for guidance\n• **\"Book an appointment for me\"** to actually do it!"
      );
      updateMsg(assistantId, { content: finalText });
      setHistory(prev => [...prev, { role:"assistant", content: finalText }]);
      speak(finalText);

      // Hint after guidance
      if (mode === "guidance") {
        const hint = getActionHint(text);
        if (hint) {
          setTimeout(() => {
            addMsg({ role:"assistant", mode:"info", content:`💡 **Want me to do this for you?** Just say:\n_"${hint}"_` });
          }, 600);
        }
      }
    }

    setIsTyping(false);
  }, [input, isTyping, flow, history, token, user, speak, addMsg, updateMsg, advanceFlow, handleConfirmation]);

  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  function getActionIntro(tool: string): string {
    switch(tool) {
      case "book_appointment":     return "Sure! I'll book an appointment for you. I just need a few details — let's go step by step.";
      case "submit_leave_query":   return "Of course! I'll submit a leave request for you. Let me collect the required information.";
      case "submit_academic_query":return "Got it! I'll submit an academic query for you. Please answer a few quick questions.";
      case "submit_exam_query":    return "Sure! I'll submit an exam query for you. Please answer these questions.";
      case "submit_other_query":   return "No problem! I'll submit an issue query for you. Please answer a few questions.";
      default: return "Let me collect the required information.";
    }
  }

  function getActionHint(text: string): string | null {
    const t = text.toLowerCase();
    if (t.match(/appointment/))   return "Book an appointment for me";
    if (t.match(/leave/))         return "Apply for sick leave for me";
    if (t.match(/drop|add.*course/)) return "Drop a course for me";
    if (t.match(/retake/))        return "Submit a mid retake request for me";
    if (t.match(/attendance/))    return "Submit an attendance issue for me";
    if (t.match(/marks?/))        return "Submit a marks update request for me";
    return null;
  }

  const toggleListening = () => {
    if (!recognitionRef.current) { alert("Use Chrome or Edge for voice input."); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { synthRef.current?.cancel(); setIsListening(true); recognitionRef.current.start(); }
  };
  const toggleVoice = () => { if (isSpeaking) synthRef.current?.cancel(); setVoiceEnabled(v => !v); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ height: "min(92vh, 750px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 text-white flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#1e40af 0%,#4f46e5 50%,#7c3aed 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 transition-colors ${
                flow ? "bg-emerald-500/80" : "bg-white/20"
              }`}>
                <Bot className="w-6 h-6"/>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"/>
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">AI Student Assistant</h2>
              <p className="text-xs text-blue-200 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3"/>
                {flow ? `Collecting: ${flow.tool.replace(/_/g," ")}` : "Smart · Agentic · Voice"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {flow && (
              <button onClick={() => { setFlow(null); addMsg({ role:"assistant", mode:"info", content:"Request cancelled. How else can I help?" }); }}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-semibold transition-all">
                Cancel
              </button>
            )}
            <button onClick={toggleVoice} className={`p-2 rounded-xl transition-all ${voiceEnabled?"bg-white/20 hover:bg-white/30":"bg-white/10 opacity-50"}`}>
              {voiceEnabled?<Volume2 className="w-4 h-4"/>:<VolumeX className="w-4 h-4"/>}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Progress bar when in flow */}
        {flow && flow.step !== "__confirm__" && FLOWS[flow.tool] && (
          <div className="flex-shrink-0 bg-emerald-50 border-b border-emerald-100 px-5 py-2">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
              <span>Collecting details for: <strong>{flow.tool.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</strong></span>
              <span>{FLOWS[flow.tool].findIndex(s=>s.key===flow.step)+1} / {FLOWS[flow.tool].length}</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((FLOWS[flow.tool].findIndex(s=>s.key===flow.step)+1) / FLOWS[flow.tool].length)*100}%` }}/>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role==="user"?"justify-end":"justify-start"} gap-2`}>
              {msg.role==="assistant" && (
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 shadow-md ${
                  msg.mode==="action"?"bg-gradient-to-br from-emerald-500 to-teal-600":
                  msg.mode==="guidance"?"bg-gradient-to-br from-amber-500 to-orange-500":
                  "bg-gradient-to-br from-blue-600 to-indigo-600"
                }`}>
                  <Bot className="w-4 h-4 text-white"/>
                </div>
              )}
              <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role==="user"?"items-end":"items-start"}`}>
                {msg.role==="assistant" && <ModeTag mode={msg.mode}/>}
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  msg.role==="user"
                    ?"bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm"
                    :"bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                }`}>
                  {msg.content
                    ?<MessageText content={msg.content}/>
                    :<span className="flex items-center gap-1.5 text-gray-400 italic text-xs"><Loader2 className="w-3 h-3 animate-spin"/>Thinking…</span>
                  }
                </div>
                {msg.actionStatus && <ActionCard tool={msg.actionStatus.tool} status={msg.actionStatus.status}/>}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-white"/>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  {[0,1,2].map(i=><span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Suggestions — only on start */}
        {showSuggestions && (
          <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Try asking:</p>
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SUGGESTIONS_GUIDANCE.map(s=>(
                  <button key={s} onClick={()=>void handleSend(s)}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700 hover:bg-amber-100 transition-all">
                    <Info className="w-3 h-3"/>{s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SUGGESTIONS_ACTION.map(s=>(
                  <button key={s} onClick={()=>void handleSend(s)}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-all">
                    <Zap className="w-3 h-3"/>{s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100">
          <div className="flex gap-3 items-end">
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKeyDown} rows={1}
              placeholder={
                flow?.step==="__confirm__" ? "Type yes to confirm or no to cancel…"
                : flow ? "Type your answer…"
                : isListening ? "🎤 Listening… speak now"
                : "Ask how, or tell me to do it for you…"
              }
              className={`flex-1 px-4 py-3 border-2 rounded-2xl text-sm resize-none focus:outline-none transition-all ${
                isListening?"border-red-400 bg-red-50 animate-pulse":
                flow?"border-emerald-300 focus:border-emerald-500 bg-emerald-50/30":
                "border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white"
              }`}
              style={{maxHeight:"100px",overflowY:"auto"}}
            />
            <button onClick={toggleListening}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md ${
                isListening?"bg-red-500 hover:bg-red-600 text-white animate-pulse":"bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}>
              {isListening?<MicOff className="w-5 h-5"/>:<Mic className="w-5 h-5"/>}
            </button>
            <button onClick={()=>void handleSend()} disabled={!input.trim()||isTyping}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">
              <Send className="w-5 h-5"/>
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            {isSpeaking?"🔊 Speaking…":flow?"📝 Collecting form details — answer each question":"🟡 Ask = Guidance  🟢 Do it = Action  · Voice "+( voiceEnabled?"ON":"OFF")}
          </p>
        </div>
      </div>
    </div>
  );
}
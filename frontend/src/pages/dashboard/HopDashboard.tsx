import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Calendar, Clock, CheckCircle, AlertCircle,
  FileText, X, Menu, LogOut, User, Bell, Settings,
  ChevronDown, Search, TrendingUp, Target, Shield,
  Users, Megaphone, CalendarDays, Plus, CheckSquare,
  Loader2, Edit2, Trash2, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api"
});
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const Modal = ({ open, onClose, title, gradient, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-gray-200 overflow-hidden">
        <div className={`${gradient} p-5 text-white flex items-center justify-between`}>
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function HopDashboard() {
  const { user: hop, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [activeView, setActiveView]         = useState("dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [queryFilter, setQueryFilter]       = useState("all");
  const [queries, setQueries]               = useState([]);
  const [appointments, setAppointments]     = useState([]);
  const [announcements, setAnnouncements]   = useState([]);
  const [stats, setStats]                   = useState({ totalStudents:0, pendingHOP:0, approvedByHOP:0, confirmedAppointments:0, activeAnnouncements:0 });
  const [loadingStats, setLoadingStats]     = useState(false);
  const [loadingData, setLoadingData]       = useState(false);
  const [processingId, setProcessingId]     = useState(null);
  const emptyAction = { open:false, queryId:"", action:"approve", remarks:"" };
  const [actionModal, setActionModal]       = useState(emptyAction);
  const emptyAnn = { open:false, editId:"", title:"", content:"", type:"general" };
  const [annModal, setAnnModal]             = useState(emptyAnn);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try { const r = await api.get("/hop/statistics/dashboard"); setStats(r.data.stats||{}); }
    catch(e){ console.error(e); } finally { setLoadingStats(false); }
  }, []);

  const fetchQueries = useCallback(async () => {
    setLoadingData(true);
    try { const r = await api.get("/hop/queries"); setQueries(r.data.queries||[]); }
    catch(e){ console.error(e); } finally { setLoadingData(false); }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoadingData(true);
    try { const r = await api.get("/hop/appointments"); setAppointments(r.data.appointments||[]); }
    catch(e){ console.error(e); } finally { setLoadingData(false); }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingData(true);
    try { const r = await api.get("/hop/announcements"); setAnnouncements(r.data.announcements||[]); }
    catch(e){ console.error(e); } finally { setLoadingData(false); }
  }, []);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeView==="queries")       { fetchQueries(); }
    if (activeView==="appointments")  { fetchAppointments(); }
    if (activeView==="announcements") { fetchAnnouncements(); }
    if (activeView==="dashboard")     { fetchQueries(); fetchAppointments(); }
  }, [activeView]);

  const openAction = (queryId, action) => setActionModal({ open:true, queryId, action, remarks:"" });

  const submitAction = async () => {
    if (!actionModal.remarks.trim()) { alert("Please enter your remarks."); return; }
    setProcessingId(actionModal.queryId);
    try {
      await api.patch(`/hop/queries/${actionModal.queryId}/${actionModal.action}`, { remarks: actionModal.remarks });
      setActionModal(emptyAction);
      fetchQueries(); fetchStats();
    } catch(e) { alert(e.response?.data?.message || "Action failed."); }
    finally { setProcessingId(null); }
  };

  const completeAppointment = async (id) => {
    try { await api.patch(`/hop/appointments/${id}/complete`); fetchAppointments(); fetchStats(); }
    catch(e){ console.error(e); }
  };

  const cancelAppointment = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try { await api.patch(`/hop/appointments/${id}/cancel`); fetchAppointments(); fetchStats(); }
    catch(e){ console.error(e); }
  };

  const saveAnnouncement = async () => {
    if (!annModal.title.trim()||!annModal.content.trim()) { alert("Title and content required."); return; }
    setLoadingData(true);
    try {
      if (annModal.editId) {
        await api.patch(`/hop/announcements/${annModal.editId}`, { title:annModal.title, content:annModal.content, type:annModal.type });
      } else {
        await api.post("/hop/announcements", { title:annModal.title, content:annModal.content, type:annModal.type });
      }
      setAnnModal(emptyAnn); fetchAnnouncements(); fetchStats();
    } catch(e){ alert(e.response?.data?.message||"Failed."); }
    finally { setLoadingData(false); }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try { await api.delete(`/hop/announcements/${id}`); fetchAnnouncements(); fetchStats(); }
    catch(e){ console.error(e); }
  };

  const getInitials = () => `${hop?.firstName?.charAt(0)||""}${hop?.lastName?.charAt(0)||""}`.toUpperCase();
  const priorityStyle = (p) => ({ high:"bg-red-100 text-red-700 border-red-200", medium:"bg-yellow-100 text-yellow-700 border-yellow-200", low:"bg-green-100 text-green-700 border-green-200" }[p]||"bg-gray-100 text-gray-700");
  const hopBadge = (status) => ({ approved:<Badge className="bg-green-100 text-green-700 border border-green-300 font-bold">✅ HOP Approved</Badge>, rejected:<Badge className="bg-red-100 text-red-700 border border-red-300 font-bold">❌ HOP Rejected</Badge> }[status] || <Badge className="bg-orange-100 text-orange-700 border border-orange-300 font-bold">⏳ Awaiting HOP</Badge>);
  const annTypeStyle = (t) => ({ exam:"bg-red-100 text-red-700 border-red-200", urgent:"bg-red-100 text-red-700 border-red-200", event:"bg-blue-100 text-blue-700 border-blue-200", general:"bg-gray-100 text-gray-700 border-gray-200" }[t]||"bg-gray-100 text-gray-700");
  const annIcon = (t) => t==="exam"?<FileText className="w-6 h-6"/>:t==="event"?<Calendar className="w-6 h-6"/>:<Megaphone className="w-6 h-6"/>;

  const filteredQueries = queries.filter(q => {
    if (queryFilter==="all") return true;
    if (queryFilter==="pending") return !q.hopStatus||q.hopStatus==="pending";
    return q.hopStatus===queryFilter;
  });
  const pendingCount = queries.filter(q=>!q.hopStatus||q.hopStatus==="pending").length;

  const statsCards = [
    { label:"Pending Approvals", value:stats.pendingHOP, icon:AlertCircle, color:"text-orange-600", bg:"bg-gradient-to-br from-orange-50 to-orange-100", border:"border-orange-200", trend:"From Advisors", trendIcon:TrendingUp, view:"queries" },
    { label:"Appointments", value:stats.confirmedAppointments, icon:Clock, color:"text-blue-600", bg:"bg-gradient-to-br from-blue-50 to-blue-100", border:"border-blue-200", trend:"Advisor Confirmed", trendIcon:Calendar, view:"appointments" },
    { label:"Total Students", value:stats.totalStudents, icon:Users, color:"text-purple-600", bg:"bg-gradient-to-br from-purple-50 to-purple-100", border:"border-purple-200", trend:"Active Enrolled", trendIcon:Target, view:"" },
    { label:"Active Announcements", value:stats.activeAnnouncements, icon:Megaphone, color:"text-green-600", bg:"bg-gradient-to-br from-green-50 to-green-100", border:"border-green-200", trend:"Posted by you", trendIcon:CheckCircle, view:"announcements" },
  ];

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"/>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"/>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome, {hop?.firstName}! 👋</h2>
            <p className="text-indigo-100 text-lg">Head of Program Dashboard - Oversee approvals, announcements, and meetings.</p>
          </div>
          <div className="hidden lg:flex w-24 h-24 bg-white/20 backdrop-blur-lg rounded-2xl items-center justify-center shadow-2xl">
            <Shield className="w-14 h-14 text-white"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((s,i) => (
          <Card key={i} onClick={()=>s.view&&setActiveView(s.view)} className={`border-2 ${s.border} shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden ${s.view?"cursor-pointer transform hover:-translate-y-1":""}`}>
            <CardContent className="p-6">
              <div className={`${s.bg} rounded-xl p-4 mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-8 w-8 ${s.color}`}/>
                  <s.trendIcon className={`h-4 w-4 ${s.color}`}/>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">{loadingStats?"...":s.value??0}</p>
                <p className="text-sm font-medium text-gray-600">{s.label}</p>
              </div>
              <p className={`text-xs font-semibold ${s.color}`}>{s.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title:"Approve Requests", icon:CheckSquare, color:"from-orange-500 to-orange-600", view:"queries" },
          { title:"Post Announcement", icon:Megaphone, color:"from-purple-500 to-purple-600", view:"announcements" },
          { title:"View Schedule", icon:CalendarDays, color:"from-blue-500 to-blue-600", view:"appointments" },
        ].map((a,i)=>(
          <Card key={i} onClick={()=>setActiveView(a.view)} className="border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 rounded-2xl overflow-hidden group">
            <div className={`h-2 bg-gradient-to-r ${a.color}`}/>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Quick Action</p>
                <p className="text-xl font-bold text-gray-900">{a.title}</p>
              </div>
              <div className={`bg-gradient-to-br ${a.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                <a.icon className="h-7 w-7 text-white"/>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-orange-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-2 rounded-lg"><AlertCircle className="w-5 h-5 text-white"/></div>
                <span className="text-xl font-bold">Urgent Approvals</span>
                {pendingCount>0&&<Badge className="bg-orange-500 text-white ml-1">{pendingCount}</Badge>}
              </div>
              <Button variant="ghost" size="sm" onClick={()=>setActiveView("queries")}>View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
            {queries.filter(q=>!q.hopStatus||q.hopStatus==="pending").slice(0,3).map(q=>(
              <div key={q._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{q.queryType}</p>
                  <p className="text-xs text-gray-500">Student: {q.studentName} &bull; via <span className="text-purple-600 font-medium">{q.advisorName||"Advisor"}</span></p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>
              </div>
            ))}
            {pendingCount===0&&<p className="text-center text-gray-500 py-4 text-sm">No pending approvals 🎉</p>}
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg"><CalendarDays className="w-5 h-5 text-white"/></div>
                <span className="text-xl font-bold">Upcoming Appointments</span>
              </div>
              <Button variant="ghost" size="sm" onClick={()=>setActiveView("appointments")}>View Schedule</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
            {appointments.slice(0,3).map(apt=>(
              <div key={apt._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{apt.studentName}</p>
                  <p className="text-xs text-gray-500">{new Date(apt.preferredDate).toLocaleDateString()} at {apt.preferredTime}</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200 capitalize">{apt.status}</Badge>
              </div>
            ))}
            {appointments.length===0&&<p className="text-center text-gray-500 py-4 text-sm">No confirmed appointments</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const QueriesView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2"><CheckSquare className="w-6 h-6"/>Approvals &amp; Requests</h3>
          <p className="text-orange-100 text-sm mt-1">Only requests verified and forwarded by Academic Advisors are shown here.</p>
        </div>

        <div className="px-6 pt-5 flex gap-2 flex-wrap border-b pb-4">
          {[
            { key:"all",      label:`All (${queries.length})` },
            { key:"pending",  label:`Pending (${queries.filter(q=>!q.hopStatus||q.hopStatus==="pending").length})` },
            { key:"approved", label:`Approved (${queries.filter(q=>q.hopStatus==="approved").length})` },
            { key:"rejected", label:`Rejected (${queries.filter(q=>q.hopStatus==="rejected").length})` },
          ].map(tab=>(
            <button key={tab.key} onClick={()=>setQueryFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${queryFilter===tab.key?"bg-orange-600 text-white border-orange-600 shadow-lg":"bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white">
          {loadingData
            ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600"/></div>
            : filteredQueries.length>0 ? (
              <div className="space-y-4">
                {filteredQueries.map(q=>(
                  <div key={q._id} className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <p className="font-bold text-gray-900 text-lg">{q.queryType}</p>
                          {hopBadge(q.hopStatus)}
                          <Badge className={`border text-xs ${q.category==="leave"?"bg-orange-50 text-orange-700 border-orange-200":"bg-purple-50 text-purple-700 border-purple-200"}`}>
                            {q.category==="leave"?"🏖️ Leave":"📚 Academic"}
                          </Badge>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${priorityStyle(q.priority)}`}>{q.priority}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Student: {q.studentName} {(q.studentId||q.batch)&&<span className="text-gray-400 font-normal">({q.studentId||q.batch})</span>}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">{q.description}</p>

                        {q.category==="leave"&&q.startDate&&(
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1">
                              <Calendar className="w-3 h-3"/>
                              {new Date(q.startDate).toLocaleDateString()} → {q.endDate?new Date(q.endDate).toLocaleDateString():""}
                            </span>
                            {q.duration&&<span className="font-bold text-orange-600">{q.duration} day(s)</span>}
                          </div>
                        )}

                        {q.category==="academic"&&q.courseName&&(
                          <p className="text-xs font-bold text-purple-700 mb-3 bg-purple-50 px-3 py-1.5 rounded-lg inline-block border border-purple-100">
                            Course: {q.courseName}
                          </p>
                        )}

                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"/>
                          <div>
                            <span className="font-bold text-green-800">Forwarded by: </span>
                            <span className="text-green-700">{q.advisorName||"Advisor"}</span>
                            {q.advisorRemarks&&<p className="text-green-600 mt-0.5 italic">"{q.advisorRemarks}"</p>}
                          </div>
                        </div>

                        {q.hopStatus!=="pending"&&q.hopRemarks&&(
                          <div className={`flex items-start gap-2 p-3 rounded-xl text-xs mt-2 ${q.hopStatus==="approved"?"bg-blue-50 border border-blue-200 text-blue-800":"bg-red-50 border border-red-200 text-red-800"}`}>
                            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                            <div><span className="font-bold">Your HOP remarks: </span><span className="italic">"{q.hopRemarks}"</span></div>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1"><Calendar className="w-3 h-3"/>Submitted: {new Date(q.createdAt).toLocaleDateString()}</p>
                      </div>

                      {(!q.hopStatus||q.hopStatus==="pending")&&(
                        <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                          <Button size="sm" onClick={()=>openAction(q._id,"approve")} disabled={!!processingId}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg whitespace-nowrap">
                            {processingId===q._id?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<CheckCircle className="h-4 w-4 mr-2"/>}
                            Approve Final
                          </Button>
                          <Button size="sm" variant="outline" onClick={()=>openAction(q._id,"reject")} disabled={!!processingId}
                            className="border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg whitespace-nowrap">
                            <X className="h-4 w-4 mr-2"/>Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                <p className="font-semibold text-gray-600 text-lg">{queryFilter==="all"?"No forwarded queries yet":`No ${queryFilter} queries`}</p>
                <p className="text-sm mt-1">Only advisor-forwarded requests appear here</p>
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );

  const AnnouncementsView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6"/>Manage Announcements</h3>
            <p className="text-purple-100 text-sm mt-1">Post exam schedules, events &amp; updates for students, teachers &amp; advisors</p>
          </div>
          <Button onClick={()=>setAnnModal({...emptyAnn,open:true})} className="bg-white text-purple-700 hover:bg-gray-100 font-bold shadow-lg">
            <Plus className="w-4 h-4 mr-2"/>Post New
          </Button>
        </div>
        <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white">
          {loadingData
            ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600"/></div>
            : announcements.length>0 ? (
              <div className="space-y-4">
                {announcements.map(a=>(
                  <div key={a._id} className="flex flex-col md:flex-row items-start gap-4 p-6 bg-white rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className={`p-4 rounded-xl flex-shrink-0 ${a.type==="exam"||a.type==="urgent"?"bg-red-100 text-red-600":a.type==="event"?"bg-blue-100 text-blue-600":"bg-gray-100 text-gray-600"}`}>
                      {annIcon(a.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="text-lg font-bold text-gray-900">{a.title}</h4>
                        <Badge variant="outline" className="flex-shrink-0 text-xs">{new Date(a.createdAt).toLocaleDateString()}</Badge>
                      </div>
                      <Badge className={`text-xs font-bold border mt-1 mb-2 ${annTypeStyle(a.type)}`}>{a.type.toUpperCase()}</Badge>
                      <p className="text-gray-600 text-sm mt-1">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2 font-medium">Posted by: {a.postedByName}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" onClick={()=>setAnnModal({open:true,editId:a._id,title:a.title,content:a.content,type:a.type})}>
                        <Edit2 className="w-4 h-4"/>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={()=>deleteAnnouncement(a._id)}>
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                <p className="font-semibold text-gray-600 text-lg">No announcements yet</p>
                <Button onClick={()=>setAnnModal({...emptyAnn,open:true})} className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800">
                  <Plus className="w-4 h-4 mr-2"/>Post First Announcement
                </Button>
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );

  const AppointmentsView = () => (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2"><CalendarDays className="w-6 h-6"/>Student Appointments</h3>
          <p className="text-blue-100 text-sm mt-1">Appointments confirmed by Advisors — only advisor-approved appointments appear here</p>
        </div>
        <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white">
          {loadingData
            ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>
            : appointments.length>0 ? (
              <div className="space-y-4">
                {appointments.map(apt=>{
                  const d = new Date(apt.preferredDate);
                  return (
                    <div key={apt._id} className="flex items-center justify-between p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-600 font-bold border border-blue-100 flex-shrink-0">
                          <span className="text-xs uppercase">{d.toLocaleString("default",{month:"short"})}</span>
                          <span className="text-xl">{d.getDate()}</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {apt.studentName}<span className="text-sm text-gray-500 font-normal ml-2">({apt.studentId})</span>
                          </h4>
                          <p className="text-sm font-medium text-blue-600 flex items-center gap-2 mt-1"><Clock className="w-4 h-4"/>{apt.preferredTime}</p>
                          <p className="text-sm text-gray-600 mt-1 capitalize">Type: <span className="font-semibold">{apt.appointmentType}</span></p>
                          <p className="text-sm text-gray-500 mt-1.5 bg-gray-50 px-3 py-1 rounded-lg inline-block border border-gray-100">{apt.reason}</p>
                          {apt.advisorComments&&<p className="text-xs text-green-700 font-medium mt-1.5">✅ Advisor: {apt.advisorComments}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge className={`${apt.status==="confirmed"?"bg-green-100 text-green-700":apt.status==="completed"?"bg-blue-100 text-blue-700":apt.status==="rescheduled"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-700"} capitalize`}>
                          {apt.status}
                        </Badge>
                        {(apt.status==="confirmed"||apt.status==="rescheduled")&&(
                          <div className="flex gap-2">
                            <Button size="sm" onClick={()=>completeAppointment(apt._id)} className="bg-blue-600 hover:bg-blue-700 text-xs rounded-lg">
                              <CheckCircle className="w-3 h-3 mr-1"/>Done
                            </Button>
                            <Button size="sm" variant="outline" onClick={()=>cancelAppointment(apt._id)} className="text-red-600 hover:bg-red-50 border-red-200 text-xs rounded-lg">
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                <p className="font-semibold text-gray-600 text-lg">No confirmed appointments</p>
                <p className="text-sm mt-1">Appointments confirmed by advisors will appear here</p>
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      <Modal open={actionModal.open} onClose={()=>setActionModal(emptyAction)}
        title={actionModal.action==="approve"?"Final Approve Request":"Reject Request"}
        gradient={actionModal.action==="approve"?"bg-gradient-to-r from-green-600 to-emerald-700":"bg-gradient-to-r from-red-600 to-rose-700"}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{actionModal.action==="approve"?"This is the final approval. The student will be notified.":"Please provide a clear reason for rejection."}</p>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Remarks <span className="text-red-500">*</span></label>
            <textarea value={actionModal.remarks} onChange={e=>setActionModal(p=>({...p,remarks:e.target.value}))}
              placeholder="Enter your remarks..." rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"/>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 border-2 font-bold rounded-xl" onClick={()=>setActionModal(emptyAction)}>Cancel</Button>
            <Button onClick={submitAction} disabled={!!processingId}
              className={`flex-1 font-bold rounded-xl ${actionModal.action==="approve"?"bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800":"bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"}`}>
              {processingId?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:actionModal.action==="approve"?<CheckCircle className="w-4 h-4 mr-2"/>:<X className="w-4 h-4 mr-2"/>}
              {actionModal.action==="approve"?"Confirm Approval":"Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={annModal.open} onClose={()=>setAnnModal(emptyAnn)}
        title={annModal.editId?"Edit Announcement":"Post New Announcement"}
        gradient="bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
            <input value={annModal.title} onChange={e=>setAnnModal(p=>({...p,title:e.target.value}))}
              placeholder="e.g. Final Exam Schedule — Fall 2024"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
            <select value={annModal.type} onChange={e=>setAnnModal(p=>({...p,type:e.target.value as any}))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white">
              <option value="general">📢 General</option>
              <option value="exam">📝 Exam</option>
              <option value="event">🎉 Event</option>
              <option value="urgent">🚨 Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Content <span className="text-red-500">*</span></label>
            <textarea value={annModal.content} onChange={e=>setAnnModal(p=>({...p,content:e.target.value}))}
              placeholder="Write the announcement details..." rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"/>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 border-2 font-bold rounded-xl" onClick={()=>setAnnModal(emptyAnn)}>Cancel</Button>
            <Button onClick={saveAnnouncement} disabled={loadingData}
              className="flex-1 font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800">
              {loadingData?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<Send className="w-4 h-4 mr-2"/>}
              {annModal.editId?"Save Changes":"Post Announcement"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sidebar */}
      <div className={`${sidebarOpen?"w-72":"w-0"} bg-white border-r-2 border-gray-200 transition-all duration-300 overflow-hidden shadow-2xl flex flex-col`}>
        <div className="p-6 border-b-2 bg-gradient-to-r from-indigo-600 to-purple-700 shadow-lg">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-indigo-600"/>
            </div>
            <div>
              <h3 className="font-bold text-xl">Smart Advisor</h3>
              <p className="text-xs text-indigo-100 font-medium">HOP Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { key:"dashboard", label:"Dashboard", icon:BookOpen, badge:0 },
            { key:"queries", label:"Approvals", icon:CheckSquare, badge:pendingCount },
            { key:"announcements", label:"Announcements", icon:Megaphone, badge:0 },
            { key:"appointments", label:"Appointments", icon:CalendarDays, badge:0 },
          ].map(item=>(
            <button key={item.key} onClick={()=>setActiveView(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-semibold ${activeView===item.key?"bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105":"text-gray-700 hover:bg-gray-100 hover:shadow"}`}>
              <item.icon className="w-5 h-5"/>
              {item.label}
              {item.badge>0&&<Badge className="ml-auto bg-orange-500 text-white text-xs">{item.badge}</Badge>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t-2 bg-gradient-to-r from-gray-50 to-indigo-50">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-4 h-4 text-gray-600"/>
            <div>
              <p className="text-xs font-bold text-gray-900">Department</p>
              <p className="text-xs text-gray-600">Software Engineering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b-2 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl transition-all">
                <Menu className="w-6 h-6 text-gray-700"/>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">HOP Dashboard</h1>
                <p className="text-xs text-gray-500 font-medium">Department Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl px-4 py-2 w-64 shadow-inner">
                <Search className="w-4 h-4 text-gray-500 mr-2"/>
                <input type="text" placeholder="Search system..." className="bg-transparent border-none outline-none text-sm w-full font-medium"/>
              </div>
              <button className="relative p-3 hover:bg-gray-100 rounded-xl transition-all shadow-sm">
                <Bell className="w-5 h-5 text-gray-600"/>
                {pendingCount>0&&<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
              </button>
              <div className="relative">
                <button onClick={()=>setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-all shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">{getInitials()}</div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-gray-900">{hop?.firstName} {hop?.lastName}</p>
                    <p className="text-xs text-gray-500 font-medium">Head of Program</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400"/>
                </button>
                {showProfileMenu&&(
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <p className="text-sm font-bold text-gray-900">{hop?.firstName} {hop?.lastName}</p>
                      <p className="text-xs text-gray-500 font-medium">{hop?.email}</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-all font-semibold"><User className="w-4 h-4 text-gray-600"/><span className="text-sm text-gray-700">Profile</span></button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-all font-semibold"><Settings className="w-4 h-4 text-gray-600"/><span className="text-sm text-gray-700">Settings</span></button>
                    <div className="border-t-2 my-2"/>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-bold transition-all">
                      <LogOut className="w-4 h-4"/><span className="text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeView==="dashboard"     && <DashboardView/>}
          {activeView==="queries"       && <QueriesView/>}
          {activeView==="announcements" && <AnnouncementsView/>}
          {activeView==="appointments"  && <AppointmentsView/>}
        </div>
      </div>
    </div>
  );
}
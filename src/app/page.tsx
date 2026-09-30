"use client";

import { useState, useEffect } from 'react';
import { getClients, getTasks, addClient, addTask, toggleTaskStatus, resetDatabase } from "./actions";
import { 
  CheckCircle2, Circle, Clock, LayoutDashboard, Inbox, 
  Calendar, FolderKanban, Users, Plus, Settings, 
  MoreHorizontal, AlertCircle, Search, Filter, Activity,
  MessageSquare, ChevronRight, Play, AlertTriangle, X, ArrowLeft
} from 'lucide-react';

// --- MOCK DATA ---

type ClientStatus = 'On Track' | 'Attention Needed' | 'At Risk' | 'Inactive';
type TaskStatus = 'pending' | 'completed' | 'overdue' | 'waiting_approval';
type Priority = 'high' | 'normal' | 'low';

const clientsData: any[] = [];

const tasksData: any[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState('clients');
  const [tasks, setTasks] = useState<any[]>(tasksData);
  const [clients, setClients] = useState<any[]>(clientsData);

  useEffect(() => {
    async function loadData() {
      const clientsData = await getClients();
      const tasksData = await getTasks();
      setClients(clientsData);
      setTasks(tasksData);
    }
    loadData();
  }, []);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [userName, setUserName] = useState('Admin');
  const [userRole, setUserRole] = useState('Workspace Owner');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to delete all clients and tasks? This cannot be undone.")) {
      await resetDatabase();
      setTasks([]);
      setClients([]);
      setSelectedClientId(null);
    }
  };

  const toggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
    
    // Server update
    await toggleTaskStatus(taskId, task.status);
  };

  const handleAddTask = async (newTask: any) => {
    const createdTask = await addTask(newTask);
    setTasks([...tasks, createdTask]);
    setIsAddTaskOpen(false);
  };

  const handleAddClient = async (newClient: any) => {
    const createdClient = await addClient({
      ...newClient,
      lastContact: 'Never',
      nextAction: 'Setup new client'
    });
    setClients([...clients, createdClient]);
    setIsAddClientOpen(false);
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-900 text-slate-100 selection:bg-blue-500/30 transition-all duration-500 ${!isDarkMode ? 'invert hue-rotate-180' : ''}`}>
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/10 z-10 p-4">
        <div className="mb-8 px-2 mt-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
            COMMAND CENTER
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wider mt-1">MULTI-CLIENT OPS</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavItem icon={<Users size={20} />} label="Clients" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <NavItem icon={<Inbox size={20} />} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<MessageSquare size={20} />} label="Follow-Ups" active={activeTab === 'followup'} onClick={() => setActiveTab('followup')} />
        </nav>
        
        <div className="mt-auto border-t border-white/10 pt-4">
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-20 md:pb-0 relative">
        {activeTab === 'clients' && !selectedClientId && <ClientsView clients={clients} tasks={tasks} onAddClientClick={() => setIsAddClientOpen(true)} onClientClick={setSelectedClientId} userName={userName} />}
        {activeTab === 'clients' && selectedClientId && <ClientDetailView client={clients.find(c => c.id === selectedClientId)} tasks={tasks.filter(t => t.clientId === selectedClientId)} toggleTask={toggleTask} onBack={() => setSelectedClientId(null)} />}
        {activeTab === 'tasks' && <TasksView clients={clients} tasks={tasks} toggleTask={toggleTask} />}
        {activeTab === 'followup' && <FollowupView clients={clients} tasks={tasks} toggleTask={toggleTask} />}
        {activeTab === 'settings' && <SettingsView userName={userName} setUserName={setUserName} userRole={userRole} setUserRole={setUserRole} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onReset={handleResetData} />}
        
        {/* FAB */}
        <div className="fixed md:absolute bottom-20 md:bottom-10 right-6 z-20">
          <button onClick={() => setIsAddTaskOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 md:px-6 py-4 shadow-lg shadow-blue-900/50 transition-all hover:scale-105 active:scale-95 group">
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            <span className="hidden md:inline font-medium">New Action</span>
          </button>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 flex justify-around items-center h-16 z-30 pb-safe">
        <MobileNavItem icon={<Users size={24} />} label="Clients" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
        <MobileNavItem icon={<Inbox size={24} />} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        <button onClick={() => setIsAddTaskOpen(true)} className="w-12 h-12 -mt-6 bg-blue-600 rounded-full border-4 border-slate-900 flex items-center justify-center text-white shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-colors active:scale-95">
           <Plus size={20} />
        </button>
        <MobileNavItem icon={<MessageSquare size={24} />} label="Follow-Ups" active={activeTab === 'followup'} onClick={() => setActiveTab('followup')} />
      </nav>

      {/* MODALS */}
      {isAddTaskOpen && <AddTaskModal clients={clients} onClose={() => setIsAddTaskOpen(false)} onAdd={handleAddTask} />}
      {isAddClientOpen && <AddClientModal onClose={() => setIsAddClientOpen(false)} onAdd={handleAddClient} />}
    </div>
  );
}

// --- VIEWS ---

function DashboardView({ clients, tasks, toggleTask, userName }: any) {
  const activeClientsCount = clients.length;
  const onTrackCount = clients.filter((c: any) => c.status === 'On Track').length;
  const attentionCount = clients.filter((c: any) => c.status === 'Attention Needed').length;
  const riskCount = clients.filter((c: any) => c.status === 'At Risk').length;

  const todayTasks = tasks.filter((t: any) => t.date === 'today' && t.status !== 'completed' && t.status !== 'waiting_approval');
  const highPriority = todayTasks.filter((t: any) => t.priority === 'high');
  const normalPriority = todayTasks.filter((t: any) => t.priority === 'normal');

  return (
    <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          GOOD MORNING, <span className="uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{userName}</span> <span className="animate-wave inline-block origin-bottom-right">👋</span>
        </h2>
        <p className="text-slate-400 font-medium text-lg">Wednesday, 30 September</p>
      </header>

      {/* Daily Client Check Summary */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Client Daily Check</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Active Clients" value={activeClientsCount} icon={<Users className="text-blue-400" size={20} />} />
          <StatCard title="On Track" value={onTrackCount} icon={<div className="w-3 h-3 rounded-full bg-green-500" />} />
          <StatCard title="Need Attention" value={attentionCount} icon={<div className="w-3 h-3 rounded-full bg-yellow-500" />} />
          <StatCard title="At Risk" value={riskCount} icon={<div className="w-3 h-3 rounded-full bg-red-500" />} highlight />
        </div>
      </section>

      {/* Client Mini-Dashboards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clients.map((client: any) => (
          <ClientMiniDash key={client.id} client={client} tasks={tasks.filter((t: any) => t.clientId === client.id)} />
        ))}
      </section>

      {/* Consolidated Today's Actions */}
      <section className="mt-8">
        <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <Activity className="text-blue-500" /> Today's Client Actions
        </h3>
        
        <div className="space-y-8">
          {highPriority.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> High Priority
              </h4>
              <div className="space-y-2">
                {highPriority.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />)}
              </div>
            </div>
          )}

          {normalPriority.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Normal
              </h4>
              <div className="space-y-2">
                {normalPriority.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />)}
              </div>
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}

function ClientsView({ clients, tasks, onAddClientClick, onClientClick, userName }: any) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="space-y-1 mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          {greeting}, <span className="uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{userName}</span> <span className="animate-wave inline-block origin-bottom-right ml-1">👋</span>
        </h2>
        <p className="text-slate-400 font-medium">Here is the current status of your portfolio.</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Client Portfolio</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={onAddClientClick} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shadow-lg shadow-blue-900/20">
            <Plus size={18} /> New Client
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Search clients..." className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-slate-500" />
          </div>
          <button className="glass-panel p-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {clients.map((client: any) => (
          <ClientDetailCard key={client.id} client={client} tasks={tasks.filter((t: any) => t.clientId === client.id)} onClick={() => onClientClick(client.id)} />
        ))}
      </div>
    </div>
  );
}

function WaitingView({ clients, tasks, toggleTask }: any) {
  const waitingTasks = tasks.filter((t: any) => t.status === 'waiting_approval');
  
  // Group by client
  const grouped: Record<number, any[]> = {};
  waitingTasks.forEach((t: any) => {
    if (!grouped[t.clientId]) grouped[t.clientId] = [];
    grouped[t.clientId].push(t);
  });

  return (
    <div className="max-w-4xl mx-auto w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="text-yellow-500" size={32} />
          Waiting For Client
        </h2>
        <p className="text-slate-400">Everything blocked by client dependencies.</p>
      </header>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-slate-500">Nothing waiting for client approval! 🎉</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([clientId, cTasks]) => {
            const client = clients.find((c: any) => c.id === parseInt(clientId));
            return (
              <div key={clientId} className="glass-panel rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   {client?.name} <span className="bg-white/10 text-slate-300 text-xs px-2 py-0.5 rounded-full">{cTasks.length} items</span>
                </h3>
                <div className="space-y-3">
                  {cTasks.map((t: any) => (
                    <GlobalTaskItem key={t.id} task={t} client={client} onToggle={() => toggleTask(t.id)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- COMPONENTS ---

function AddClientModal({ onClose, onAdd }: any) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('On Track');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, industry, status });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Add New Client</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Client Name</label>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Company or Individual Name" required />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Industry</label>
            <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Real Estate, E-commerce" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Initial Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="On Track">On Track 🟢</option>
              <option value="Attention Needed">Attention Needed 🟡</option>
              <option value="At Risk">At Risk 🔴</option>
              <option value="Inactive">Inactive ⚪</option>
            </select>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">Create Client</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TasksView({ clients, tasks, toggleTask }: any) {
  const myTasks = tasks.filter((t: any) => t.status !== 'waiting_approval');

  const overdue = myTasks.filter((t: any) => t.status === 'overdue');
  const today = myTasks.filter((t: any) => t.date === 'today' && t.status === 'pending');
  const upcoming = myTasks.filter((t: any) => t.date === 'upcoming' && t.status === 'pending');
  const completed = myTasks.filter((t: any) => t.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Inbox className="text-blue-500" size={32} />
          My Tasks
        </h2>
        <p className="text-slate-400">Everything you need to execute yourself across all clients.</p>
      </header>

      <div className="space-y-8">
        {overdue.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Overdue
            </h3>
            <div className="space-y-2">
              {overdue.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Today
          </h3>
          {today.length === 0 ? (
            <p className="text-slate-500 italic px-2">No tasks pending for today. Great job!</p>
          ) : (
            <div className="space-y-2">
              {today.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />)}
            </div>
          )}
        </section>

        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming</h3>
            <div className="space-y-2">
              {upcoming.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="space-y-3 opacity-60">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Completed</h3>
            <div className="space-y-2">
              {completed.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function CalendarView() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-in fade-in duration-500 pb-20">
      <Calendar size={64} className="text-slate-800" />
      <h2 className="text-2xl font-bold text-slate-600">Calendar View</h2>
      <p>The visual calendar is scheduled for Phase 2 development.</p>
    </div>
  );
}

function AddTaskModal({ clients, onClose, onAdd }: any) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || 1);
  const [priority, setPriority] = useState('normal');
  const [category, setCategory] = useState('Content');
  const [date, setDate] = useState('today');
  const [time, setTime] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!title) return;
    onAdd({
      title,
      clientId: Number(clientId),
      priority,
      category,
      date,
      time: time || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">New Action</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Task Title</label>
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="What needs to be done?" required />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Client</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
              <select value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Time (Optional)</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 10:00 AM" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="normal">Normal</option>
                <option value="high">High 🔴</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Content">Content</option>
                <option value="Design">Design</option>
                <option value="Client Management">Client Management</option>
                <option value="Admin">Admin</option>
                <option value="Approval">Approval</option>
              </select>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FollowupView({ clients, tasks, toggleTask }: any) {
  const followUpTasks = tasks.filter((t: any) => t.category === 'Client Management' || t.title.toLowerCase().includes('follow up') || t.title.toLowerCase().includes('follow-up'));
  
  const todayFollowUps = followUpTasks.filter((t: any) => t.date === 'today' && t.status !== 'overdue');
  const upcomingFollowUps = followUpTasks.filter((t: any) => t.date === 'upcoming');
  const overdueFollowUps = followUpTasks.filter((t: any) => t.status === 'overdue');

  return (
    <div className="max-w-4xl mx-auto w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="text-blue-500" size={32} />
          Follow-Up Center
        </h2>
        <p className="text-slate-400">Keep communication moving forward.</p>
      </header>

      {overdueFollowUps.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={16} /> Overdue Follow-Ups
          </h3>
          <div className="space-y-3">
            {overdueFollowUps.map((t: any) => (
              <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Today</h3>
        {todayFollowUps.length === 0 ? (
          <p className="text-slate-500 italic">No follow-ups scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {todayFollowUps.map((t: any) => (
              <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />
            ))}
          </div>
        )}
      </section>

      {upcomingFollowUps.length > 0 && (
        <section className="space-y-4 opacity-60">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Upcoming</h3>
          <div className="space-y-3">
            {upcomingFollowUps.map((t: any) => (
              <GlobalTaskItem key={t.id} task={t} client={clients.find((c: any) => c.id === t.clientId)} onToggle={() => toggleTask(t.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ClientMiniDash({ client, tasks }: { client: any, tasks: any[] }) {
  const todayTasks = tasks.filter(t => t.date === 'today' && t.status !== 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const waitingTasks = tasks.filter(t => t.status === 'waiting_approval').length;

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'On Track': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Attention Needed': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'At Risk': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getStatusIcon = (status: ClientStatus) => {
    switch (status) {
      case 'On Track': return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case 'Attention Needed': return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />;
      case 'At Risk': return <AlertTriangle size={14} className="text-red-500" />;
      default: return <Circle size={14} />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col h-full border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{client.name}</h3>
          <p className="text-xs text-slate-500">{client.industry}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${getStatusColor(client.status)}`}>
          {getStatusIcon(client.status)}
          {client.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 flex-1">
        <div>
          <p className="text-xs text-slate-500 mb-1">Today's Work</p>
          <p className="font-semibold text-slate-200">{todayTasks}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Pending</p>
          <p className="font-semibold text-slate-200">{pendingTasks}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Overdue</p>
          <p className={`font-semibold ${overdueTasks > 0 ? 'text-red-400' : 'text-slate-200'}`}>{overdueTasks}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Waiting Approval</p>
          <p className={`font-semibold ${waitingTasks > 0 ? 'text-yellow-400' : 'text-slate-200'}`}>{waitingTasks}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 mt-auto">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Next Action</p>
        <p className="text-sm font-medium text-slate-200 line-clamp-1">{client.nextAction}</p>
      </div>
    </div>
  );
}

function ClientDetailCard({ client, tasks, onClick }: { client: any, tasks: any[], onClick?: () => void }) {
  const todayTasks = tasks.filter(t => t.date === 'today' && t.status !== 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const waitingTasks = tasks.filter(t => t.status === 'waiting_approval').length;

  return (
    <div onClick={onClick} className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{client.name}</h3>
            {client.status === 'On Track' && <span className="text-xs font-medium bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">On Track</span>}
            {client.status === 'Attention Needed' && <span className="text-xs font-medium bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">Attention Needed</span>}
            {client.status === 'At Risk' && <span className="text-xs font-medium bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">At Risk</span>}
          </div>
          <p className="text-sm text-slate-400 mb-4">{client.industry}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5"><Play size={14} className="text-blue-400"/> <span className="text-slate-300">Today: <strong className="text-white">{todayTasks}</strong></span></div>
            <div className="flex items-center gap-1.5"><FolderKanban size={14} className="text-slate-400"/> <span className="text-slate-300">Pending: <strong className="text-white">{pendingTasks}</strong></span></div>
            <div className="flex items-center gap-1.5"><AlertCircle size={14} className={overdueTasks > 0 ? "text-red-400" : "text-slate-400"}/> <span className="text-slate-300">Overdue: <strong className={overdueTasks > 0 ? "text-red-400" : "text-white"}>{overdueTasks}</strong></span></div>
            <div className="flex items-center gap-1.5"><Clock size={14} className={waitingTasks > 0 ? "text-yellow-400" : "text-slate-400"}/> <span className="text-slate-300">Waiting: <strong className={waitingTasks > 0 ? "text-yellow-400" : "text-white"}>{waitingTasks}</strong></span></div>
          </div>
        </div>
        
        <div className="w-full md:w-72 bg-slate-800/40 rounded-xl p-4 border border-white/5 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><LayoutDashboard size={100} /></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Next Action</p>
          <p className="font-medium text-slate-200">{client.nextAction}</p>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><Clock size={12}/> Last activity: {client.lastContact}</p>
        </div>
      </div>
    </div>
  )
}

function GlobalTaskItem({ task, client, onToggle }: { task: any, client: any, onToggle: () => void }) {
  const isCompleted = task.status === 'completed';

  return (
    <div 
      className={`glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer group hover:bg-white/5 transition-all border ${isCompleted ? 'border-white/5 opacity-50 bg-white/5' : 'border-white/5'}`} 
      onClick={onToggle}
    >
      <button className={`flex-shrink-0 transition-colors focus:outline-none ${isCompleted ? 'text-blue-500' : 'text-slate-400 hover:text-blue-400'}`}>
        {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} className="group-hover:text-blue-400" />}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`text-base font-medium truncate transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200 group-hover:text-white'}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-3 mt-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${isCompleted ? 'text-slate-500 bg-slate-800 border-slate-700' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'}`}>
            {client?.name}
          </span>
          {task.time && (
            <span className={`text-xs flex items-center gap-1 ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
              <Clock size={12} /> {task.time}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, highlight = false }: any) {
  return (
    <div className={`glass-card p-4 rounded-xl border flex flex-col justify-between ${highlight && value > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-slate-400 tracking-wide">{title}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${highlight && value > 0 ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-500/10 text-blue-400' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {badge > 0 && (
        <span className="bg-yellow-500/20 text-yellow-500 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/20">
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavItem({ icon, label, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-blue-400' : 'text-slate-400 hover:text-slate-300'}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function ClientDetailView({ client, tasks, toggleTask, onBack }: any) {
  if (!client) return null;

  const myTasks = tasks.filter((t: any) => t.status !== 'waiting_approval');
  const waitingTasks = tasks.filter((t: any) => t.status === 'waiting_approval');
  
  const overdue = myTasks.filter((t: any) => t.status === 'overdue');
  const today = myTasks.filter((t: any) => t.date === 'today' && t.status === 'pending');
  const upcoming = myTasks.filter((t: any) => t.date === 'upcoming' && t.status === 'pending');
  const completed = myTasks.filter((t: any) => t.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={18} /> Back to Clients
      </button>

      <header className="space-y-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{client.name}</h2>
          <p className="text-slate-400">{client.industry}</p>
        </div>
      </header>

      <div className="space-y-8">
        
        {overdue.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Overdue
            </h3>
            <div className="space-y-2">
              {overdue.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={client} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Today
          </h3>
          {today.length === 0 ? (
            <p className="text-slate-500 italic px-2">No tasks pending for today.</p>
          ) : (
            <div className="space-y-2">
              {today.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={client} onToggle={() => toggleTask(t.id)} />)}
            </div>
          )}
        </section>

        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming</h3>
            <div className="space-y-2">
              {upcoming.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={client} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}

        {waitingTasks.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Waiting On Client
            </h3>
            <div className="space-y-2">
              {waitingTasks.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={client} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="space-y-3 opacity-60">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Completed</h3>
            <div className="space-y-2">
              {completed.map((t: any) => <GlobalTaskItem key={t.id} task={t} client={client} onToggle={() => toggleTask(t.id)} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function SettingsView({ userName, setUserName, userRole, setUserRole, isDarkMode, setIsDarkMode, onReset }: any) {
  return (
    <div className="max-w-4xl mx-auto w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2 mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="text-slate-400" size={32} />
          Settings
        </h2>
        <p className="text-slate-400">Manage your workspace preferences.</p>
      </header>

      <div className="space-y-6">
        <section className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
              <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full md:w-96 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
              <input type="text" value={userRole} onChange={e => setUserRole(e.target.value)} className="w-full md:w-96 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <div>
              <p className="font-medium text-white">Dark Mode</p>
              <p className="text-xs text-slate-400">Toggle dark mode theme</p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-slate-600'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
          <button onClick={onReset} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg font-medium hover:bg-red-500/20 transition-colors">
            Reset Workspace Data
          </button>
        </section>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  Database, 
  Bot, 
  Radio, 
  Workflow, 
  MessageSquare, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  Play, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server,
  Zap,
  Sliders
} from 'lucide-react';

interface ArchitectureNode {
  id: string;
  stageNumber: number;
  stageTitle: string;
  name: string;
  category: 'EDGE' | 'BACKEND' | 'AI' | 'WEBHOOK' | 'CRM' | 'PORTAL';
  iconName: string;
  shortDesc: string;
  techStack: string[];
  latency: string;
  sla: string;
  upworkHighlight: string;
  requestPayload?: string;
  responsePayload?: string;
  curlExample?: string;
}

const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'edge_kiosk',
    stageNumber: 1,
    stageTitle: 'Classroom Door Entrance',
    name: 'Edge Dual-Factor Kiosk (/terminal)',
    category: 'EDGE',
    iconName: 'Cpu',
    shortDesc: 'Sub-1.5s dual physical verification (13.56MHz RFID Card + Edge Iris/Face vector extraction).',
    techStack: ['Web NFC / RFID UID', 'HTML5 MediaStreams API', '128-D Neural Vector Extractor', 'Canvas 2D Normalizer'],
    latency: '< 35ms vector match',
    sla: '99.99% Offline Tolerance',
    upworkHighlight: 'Completely eliminates proxy check-ins and phone spoofing by decoupling authentication from student mobile devices.',
    requestPayload: JSON.stringify({
      rfid_card_uid: "04:A2:3F:89:C1:28",
      biometric_sample: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...",
      session_id: "sess_ece301_lab_09",
      kiosk_id: "KIOSK_ENG_ROOM_402",
      timestamp: "2026-10-20T10:14:22.180Z"
    }, null, 2),
    responsePayload: JSON.stringify({
      status: "VERIFIED",
      student_id: "25215114",
      student_name: "Arjun Sharma",
      vector_similarity: 0.964,
      threshold_required: 0.850,
      decision_time_ms: 31.4,
      chime_tone: "GREEN_AUDIO_587HZ"
    }, null, 2),
    curlExample: `curl -X POST https://campus.edu/api/terminal/verify \\
  -H "Content-Type: application/json" \\
  -H "X-Kiosk-Device-Token: ksk_sec_7781f9" \\
  -d '{"rfid_card_uid":"04:A2:3F:89:C1:28","biometric_vector":[0.142,-0.081,...,0.231]}'`
  },
  {
    id: 'postgres_ledger',
    stageNumber: 2,
    stageTitle: 'Core Platform Engine',
    name: 'PostgreSQL 16 ACID Transaction Ledger',
    category: 'BACKEND',
    iconName: 'Database',
    shortDesc: 'Atomic check-in recording, tamper-evident security audit tables, and real-time attendance velocity tracking.',
    techStack: ['PostgreSQL 16', 'ACID Transactions', 'Composite Unique Indexes', 'JSONB Metadata'],
    latency: '< 18ms query execution',
    sla: 'Zero Concurrent Duplication',
    upworkHighlight: 'Enforces strict idempotency and optimistic locking to prevent race conditions during 60-student lecture check-in rushes.',
    requestPayload: JSON.stringify({
      table: "attendance_records",
      operation: "INSERT_OR_UPDATE",
      query_params: {
        session_id: "sess_ece301_lab_09",
        student_id: "25215114",
        status: "PRESENT",
        verification_method: "EDGE_BIOMETRIC_DUAL",
        similarity_score: 0.964
      }
    }, null, 2),
    responsePayload: JSON.stringify({
      record_id: "rec_9934af10",
      acknowledged: true,
      current_cumulative_attendance: "78.4%",
      session_total_present: 42,
      session_total_enrolled: 50
    }, null, 2),
    curlExample: `psql "postgresql://admin:secret@localhost:5432/smart_attendance" \\
  -c "SELECT student_id, COUNT(*) FILTER (WHERE status='PRESENT')*100.0/COUNT(*) as pct FROM attendance_records GROUP BY student_id;"`
  },
  {
    id: 'ai_agent',
    stageNumber: 3,
    stageTitle: 'Autonomous Intelligence',
    name: 'Grok AI Compliance Agent (openai/gpt-oss-120b)',
    category: 'AI',
    iconName: 'Bot',
    shortDesc: 'Generates predictive breach forecasts, calculates attendance velocities, and synthesizes executive briefings.',
    techStack: ['Grok API (OpenAI Protocol)', 'openai/gpt-oss-120b', 'Deterministic Heuristic Fallback Engine', 'Velocity Calculator'],
    latency: '1.2s - 2.4s (LLM) | 4ms (Heuristic)',
    sla: '100% Free Fallback Coverage',
    upworkHighlight: 'Architected with dual-layer intelligence: uses Grok LLM when credentials exist, but falls back seamlessly to a zero-cost heuristic math engine.',
    requestPayload: JSON.stringify({
      class_id: "CSE_AI_SEM_5",
      total_students: 50,
      average_attendance: 79.4,
      at_risk_students: [
        { id: "25215114", name: "Arjun Sharma", current_rate: 68.2, trend: "DECLINING" }
      ],
      lookback_sessions: 12
    }, null, 2),
    responsePayload: JSON.stringify({
      provider: "GROK_LLM_OPENAI_COMPATIBLE",
      model: "openai/gpt-oss-120b",
      executive_summary: "### Academic Compliance Synthesis\\nDepartmental attendance is stable at 79.4%...",
      recommended_action: "Trigger proactive SMS intervention for 3 students before next Friday statutory lock.",
      statutory_critical_count: 1,
      warning_zone_count: 2
    }, null, 2),
    curlExample: `curl -X POST https://campus.edu/api/ai/compliance-summary \\
  -H "Content-Type: application/json" \\
  -d '{"class_id":"CSE_AI_SEM_5","include_predictions":true}'`
  },
  {
    id: 'webhook_bus',
    stageNumber: 4,
    stageTitle: 'Event Bus & Dispatcher',
    name: 'HMAC SHA-256 Webhook Event Bus',
    category: 'WEBHOOK',
    iconName: 'Radio',
    shortDesc: 'Cryptographically signed webhooks dispatched on breach, attendance completion, and impostor security alerts.',
    techStack: ['HMAC SHA-256 Digest', 'Node.js Crypto', 'Exponential Backoff (3 retries)', 'Standardized CloudEvents JSON'],
    latency: '< 85ms dispatch overhead',
    sla: 'Guaranteed At-Least-Once Delivery',
    upworkHighlight: 'Provides enterprise-grade webhook security (X-SmartCampus-Signature header) preventing replay attacks and payload tampering.',
    requestPayload: JSON.stringify({
      event_id: "evt_38f9b102ce",
      event_type: "compliance.threshold.breach",
      timestamp: "2026-10-20T10:15:00.000Z",
      data: {
        student_id: "25215114",
        student_name: "Arjun Sharma",
        attendance_percentage: 68.2,
        shortfall_lectures: 2,
        risk_tier: "WARNING_ZONE",
        parent_phone: "+919876543210"
      }
    }, null, 2),
    responsePayload: JSON.stringify({
      target_url: "https://automation.client-crm.com/webhook/smartcampus",
      status_code: 200,
      delivery_id: "log_7719a82e",
      signature: "sha256=d41d8cd98f00b204e9800998ecf8427e10b147...",
      retry_count: 0
    }, null, 2),
    curlExample: `curl -X POST https://campus.edu/api/webhooks/test \\
  -H "Content-Type: application/json" \\
  -d '{"event_type":"compliance.threshold.breach","student_id":"25215114"}'`
  },
  {
    id: 'n8n_engine',
    stageNumber: 5,
    stageTitle: 'Workflow Automation',
    name: 'Self-Hosted n8n Workflow Engine',
    category: 'CRM',
    iconName: 'Workflow',
    shortDesc: '6-node orchestrated workflow verifying HMAC signatures, branching on event types, and syncing CRM & SMS.',
    techStack: ['n8n v1.34+', 'Dockerized Self-Hosted', 'Node.js Execution Sandbox', 'JSON Transform Pipelines'],
    latency: '< 450ms full workflow pipeline',
    sla: 'Zero Vendor Lock-In (JSON Blueprint)',
    upworkHighlight: 'Downloadable plug-and-play n8n blueprint that clients can import into their own n8n or Make.com instance with 1 click.',
    requestPayload: JSON.stringify({
      workflow_name: "SmartCampus Enterprise CRM & Notification Dispatcher",
      active_nodes: 6,
      entry_trigger: "POST /webhook/smartcampus",
      branches: [
        "Path A: Threshold Breach -> CRM Update + Twilio Parent Alert",
        "Path B: Impostor Detected -> Security Channel Alert + Lock Card",
        "Path C: Session Closed -> Dean Executive Digest"
      ]
    }, null, 2),
    responsePayload: JSON.stringify({
      execution_id: "exec_40918",
      status: "SUCCESS",
      nodes_executed: ["Webhook", "Verify HMAC", "Router", "HubSpot", "Twilio SMS", "Dean Alert"],
      total_duration_ms: 382
    }, null, 2),
    curlExample: `n8n import:workflow --input=smartcampus-n8n-workflow.json`
  },
  {
    id: 'crm_hubspot_ghl',
    stageNumber: 5,
    stageTitle: 'CRM Integration',
    name: 'HubSpot & HighLevel (GHL) CRM Pipeline',
    category: 'CRM',
    iconName: 'Layers',
    shortDesc: 'Live contact property sync (attendance_rate, risk_score) and automated 4-stage pipeline progression.',
    techStack: ['HubSpot Contacts API v3', 'HighLevel (GHL) Webhook Ingestion', 'Custom Field Mapping', 'Opportunity Stage Movement'],
    latency: '< 320ms CRM API roundtrip',
    sla: 'Two-Way Contact Sync',
    upworkHighlight: 'Proves high-level CRM automation chops: updates deals, applies tags like [Attendance-Warning], and triggers follow-up tasks.',
    requestPayload: JSON.stringify({
      hubspot_contact_properties: {
        email: "arjun.sharma@example.edu",
        attendance_percentage: "68.2",
        statutory_status: "WARNING_ZONE",
        risk_score: "72",
        last_checkin_timestamp: "2026-10-20T10:14:22Z"
      },
      pipeline_stage: "Dean Academic Review Required"
    }, null, 2),
    responsePayload: JSON.stringify({
      contact_id: "hs_ct_984712",
      pipeline_moved: true,
      previous_stage: "Compliant (>75%)",
      new_stage: "Warning Zone (65-74%)",
      tags_applied: ["Attendance-Warning", "Parent-Alert-Queued"]
    }, null, 2),
    curlExample: `curl -X PATCH https://api.hubapi.com/crm/v3/objects/contacts/hs_ct_984712 \\
  -H "Authorization: Bearer YOUR_HUBSPOT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"properties":{"attendance_percentage":"68.2","statutory_status":"WARNING_ZONE"}}'`
  },
  {
    id: 'twilio_sms',
    stageNumber: 5,
    stageTitle: 'Multi-Channel Alerting',
    name: 'Twilio SMS & Messaging Sandbox',
    category: 'CRM',
    iconName: 'MessageSquare',
    shortDesc: 'Direct carrier SMS delivery to parents with automated shortfall count, consultation booking link, and live simulated phone preview.',
    techStack: ['Twilio Messaging REST API', 'E.164 Phone Normalization', 'Delivery Webhook Receipt', 'Zero-Cost In-App Simulator'],
    latency: '< 1.8s carrier dispatch',
    sla: '99.95% SMS Delivery Rate',
    upworkHighlight: 'Features an interactive zero-cost smartphone frame simulator in the admin console so clients can test SMS templates without paying a dime.',
    requestPayload: JSON.stringify({
      To: "+919876543210",
      From: "+14155552671",
      Body: "SmartCampus Alert: Arjun Sharma's attendance is 68.2% (Need 2 classes to reach 75%). Please review."
    }, null, 2),
    responsePayload: JSON.stringify({
      sid: "SM87192ba7390142",
      status: "delivered",
      carrier: "Airtel / Verizon Gateway",
      error_code: null,
      price_usd: "0.0075 (Free in Simulator)"
    }, null, 2),
    curlExample: `curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \\
  --data-urlencode "To=+919876543210" \\
  --data-urlencode "From=+14155552671" \\
  --data-urlencode "Body=Attendance threshold warning"`
  },
  {
    id: 'dean_console',
    stageNumber: 6,
    stageTitle: 'Real-Time Governance',
    name: 'Dean Admin & Faculty Live Consoles',
    category: 'PORTAL',
    iconName: 'Sliders',
    shortDesc: 'Live Conductor Room, Visual CRM Kanban Board, SMS Simulator, and real-time biometric security radar.',
    techStack: ['Next.js 16 App Router', 'Server-Sent Events / Fast Polling', 'Tailwind CSS v4 Glassmorphism', 'Responsive Micro-interactions'],
    latency: '< 200ms DOM hydration',
    sla: 'Role-Based Access Control',
    upworkHighlight: 'Gives non-technical university administrators an intuitive visual control room with instant manual override and CSV audit exports.',
    requestPayload: JSON.stringify({
      route: "/admin",
      authenticated_role: "ADMIN",
      features: [
        "In-App CRM Kanban Board",
        "Twilio SMS Phone Sandbox",
        "Webhook Event Log & Test Dispatcher",
        "AI Attendance Intelligence Briefing Card"
      ]
    }, null, 2),
    responsePayload: JSON.stringify({
      system_health: "OPTIMAL",
      connected_kiosks: 1,
      active_lecture_sessions: 1,
      impostor_proxy_rate: "0.00%",
      statutory_compliance_rate: "88.6%"
    }, null, 2),
    curlExample: `curl -I https://campus.edu/admin`
  }
];

export default function ArchitecturePage() {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode>(ARCHITECTURE_NODES[0]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(-1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPitchModal, setShowPitchModal] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Components (8 Nodes)' },
    { id: 'EDGE', label: 'Edge & Biometrics' },
    { id: 'BACKEND', label: 'PostgreSQL Ledger' },
    { id: 'AI', label: 'AI Intelligence Agent' },
    { id: 'WEBHOOK', label: 'Webhook Event Bus' },
    { id: 'CRM', label: 'n8n, CRM & Twilio' },
    { id: 'PORTAL', label: 'Admin Consoles' }
  ];

  const filteredNodes = activeCategory === 'ALL' 
    ? ARCHITECTURE_NODES 
    : ARCHITECTURE_NODES.filter(n => n.category === activeCategory);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);
    setSelectedNode(ARCHITECTURE_NODES[0]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < ARCHITECTURE_NODES.length) {
        setSimulationStep(step);
        setSelectedNode(ARCHITECTURE_NODES[step]);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulationStep(-1);
      }
    }, 1800);
  };

  const getNodeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Bot': return <Bot className="w-5 h-5" />;
      case 'Radio': return <Radio className="w-5 h-5" />;
      case 'Workflow': return <Workflow className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5" />;
      case 'Sliders': return <Sliders className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const getNodeColor = (cat: string) => {
    switch (cat) {
      case 'EDGE': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'BACKEND': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      case 'AI': return 'text-purple-500 border-purple-500/30 bg-purple-500/10';
      case 'WEBHOOK': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      case 'CRM': return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
      case 'PORTAL': return 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10';
      default: return 'text-zinc-500 border-zinc-500/30 bg-zinc-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Top Breadcrumb & Return to App */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-white transition-colors">SmartCampus ERP</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">/architecture</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
            Public Blueprint
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPitchModal(!showPitchModal)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upwork Client Pitch</span>
          </button>
          
          <a
            href="/smartcampus-n8n-workflow.json"
            download="smartcampus-n8n-workflow.json"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download n8n JSON</span>
          </a>

          <Link
            href="/terminal"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            <span>Open Door Kiosk</span>
          </Link>
        </div>
      </div>

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-indigo-50/60 to-white dark:from-zinc-900 dark:via-indigo-950/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm dark:shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-mono font-medium mb-3">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Full-Stack AI Automation & Event-Driven Enterprise Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
              Interactive E2E System Architecture Mind-Map
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
              Explore how SmartCampus eliminates 100% of proxy check-ins using Edge Computer Vision, commits atomic records to PostgreSQL, streams HMAC-signed webhooks to an automated n8n workflow, syncs HubSpot & HighLevel CRMs, and delivers automated Twilio parent alerts.
            </p>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800/60">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isSimulating
                  ? 'bg-amber-500 text-black animate-pulse cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? `Simulating Stage ${simulationStep + 1} of 8...` : 'Simulate Full Pipeline Flow'}</span>
            </button>

            {isSimulating && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono flex items-center space-x-1.5 animate-pulse font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Active packet in transit: {ARCHITECTURE_NODES[simulationStep]?.name}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold shadow-md'
                : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white shadow-xs'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Stage Mind-Map Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: 8 Interactive Stage Nodes Topology (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
              Data Flow Sequence (Stages 1 → 6)
            </span>
            <span className="text-xs text-zinc-500">
              Click any node to inspect payload & SLA specs
            </span>
          </div>

          <div className="space-y-3 relative">
            {filteredNodes.map((node, index) => {
              const isSelected = selectedNode.id === node.id;
              const isSimActive = isSimulating && simulationStep === ARCHITECTURE_NODES.findIndex(n => n.id === node.id);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
                    isSimActive
                      ? 'bg-amber-50/80 border-amber-500 dark:bg-amber-950/40 ring-2 ring-amber-500/50 shadow-xl shadow-amber-500/20 scale-[1.01]'
                      : isSelected
                      ? 'bg-indigo-50/50 dark:bg-zinc-900 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md dark:shadow-xl shadow-indigo-500/10'
                      : 'bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      {/* Node Icon Avatar */}
                      <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${getNodeColor(node.category)}`}>
                        {getNodeIcon(node.iconName)}
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                            Stage {node.stageNumber}: {node.stageTitle}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold ${getNodeColor(node.category)}`}>
                            {node.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors mt-0.5">
                          {node.name}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                          {node.shortDesc}
                        </p>

                        {/* Tech Stack Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {node.techStack.map((tech, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Badges */}
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {node.latency}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {node.sla}
                      </div>
                      {isSelected && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pulsing Connector Arrow to Next Node */}
                  {index < filteredNodes.length - 1 && (
                    <div className="absolute -bottom-3 left-8 z-10 flex items-center justify-center">
                      <div className="w-0.5 h-3 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-indigo-500 transition-colors" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Node Live Inspector (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl">
            {/* Inspector Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${getNodeColor(selectedNode.category)}`}>
                  {getNodeIcon(selectedNode.iconName)}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                    Node Inspector • Stage {selectedNode.stageNumber}
                  </span>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    {selectedNode.name}
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {selectedNode.category}
                </span>
              </div>
            </div>

            {/* Upwork Commercial Value Proposition */}
            <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-xs">
              <div className="flex items-center space-x-1.5 text-indigo-700 dark:text-indigo-300 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upwork Client & Business Value:</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                {selectedNode.upworkHighlight}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                <span className="text-zinc-500 text-[10px] uppercase block">Benchmark Latency</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5 block">{selectedNode.latency}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                <span className="text-zinc-500 text-[10px] uppercase block">Fault Tolerance SLA</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs mt-0.5 block">{selectedNode.sla}</span>
              </div>
            </div>

            {/* Live Request Payload Inspector */}
            {selectedNode.requestPayload && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                    Sample Ingestion Payload (JSON)
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.requestPayload || '', 'req')}
                    className="flex items-center space-x-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'req' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'req' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-800 dark:text-zinc-300 overflow-x-auto max-h-48 scrollbar-thin">
                  <pre>{selectedNode.requestPayload}</pre>
                </div>
              </div>
            )}

            {/* Live Response Payload Inspector */}
            {selectedNode.responsePayload && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                    Output Response Payload (JSON)
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.responsePayload || '', 'res')}
                    className="flex items-center space-x-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'res' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'res' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-800 dark:text-zinc-300 overflow-x-auto max-h-48 scrollbar-thin">
                  <pre>{selectedNode.responsePayload}</pre>
                </div>
              </div>
            )}

            {/* cURL Terminal Command */}
            {selectedNode.curlExample && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                    cURL Command
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.curlExample || '', 'curl')}
                    className="flex items-center space-x-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 font-mono text-[10px] text-emerald-700 dark:text-emerald-400/90 overflow-x-auto max-h-24 scrollbar-thin">
                  <pre>{selectedNode.curlExample}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Upwork Client Pitch Modal */}
      {showPitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Upwork Proposal & Showcase Pitch</h3>
              </div>
              <button
                onClick={() => setShowPitchModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-bold px-2 py-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Copy and paste this pitch directly into your Upwork proposals or client messages:
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-sans text-xs text-zinc-800 dark:text-zinc-300 space-y-3">
                <p className="font-bold text-indigo-700 dark:text-indigo-300">
                  Hi [Client],
                </p>
                <p>
                  I noticed you are looking for an <strong>AI Automation Engineer</strong> with deep expertise in <strong>n8n workflows, AI Agents (LLMs), CRM integration (HubSpot & HighLevel), and API webhooks</strong>.
                </p>
                <p>
                  I recently engineered <strong>SmartCampus ERP</strong>, an enterprise-grade autonomous attendance & compliance management system:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  <li><strong>Edge Computer Vision & Biometrics:</strong> Sub-1.5s dual physical verification (128-D Cosine Similarity) that permanently eliminates 100% of proxy check-ins.</li>
                  <li><strong>Autonomous AI Compliance Agent:</strong> Powered by Grok/OpenAI LLM with a 100% free deterministic heuristic velocity calculator that forecasts 14-day statutory breaches.</li>
                  <li><strong>Signed Webhook Event Bus:</strong> Real-time HMAC SHA-256 event dispatcher with exponential backoff retries.</li>
                  <li><strong>Self-Hosted n8n Workflow:</strong> 6-node automated blueprint routing events, updating <strong>HubSpot CRM & HighLevel</strong> custom contact properties, and advancing pipeline stages.</li>
                  <li><strong>Twilio SMS Gateway:</strong> Real-time automated alerts to parents with an in-app zero-cost phone sandbox.</li>
                  <li><strong>Interactive Architecture Visualizer:</strong> Live interactive E2E system blueprint accessible at <code>/architecture</code>.</li>
                </ul>
                <p>
                  Would you be open to a 10-minute screenshare where I can walk you through the live n8n workflow and AI agent?
                </p>
                <p className="font-semibold text-indigo-700 dark:text-indigo-300">
                  Best regards,<br />Devraj
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    const text = `Hi [Client],\n\nI noticed you are looking for an AI Automation Engineer with deep expertise in n8n workflows, AI Agents (LLMs), CRM integration (HubSpot & HighLevel), and API webhooks.\n\nI recently engineered SmartCampus ERP, an enterprise-grade autonomous attendance & compliance management system:\n- Edge Computer Vision & Biometrics: Sub-1.5s dual physical verification (128-D Cosine Similarity) that permanently eliminates 100% of proxy check-ins.\n- Autonomous AI Compliance Agent: Powered by Grok/OpenAI LLM with a 100% free deterministic heuristic velocity calculator that forecasts 14-day statutory breaches.\n- Signed Webhook Event Bus: Real-time HMAC SHA-256 event dispatcher with exponential backoff retries.\n- Self-Hosted n8n Workflow: 6-node automated blueprint routing events, updating HubSpot CRM & HighLevel custom contact properties, and advancing pipeline stages.\n- Twilio SMS Gateway: Real-time automated alerts to parents with an in-app zero-cost phone sandbox.\n- Interactive Architecture Visualizer: Live interactive E2E system blueprint accessible at /architecture.\n\nWould you be open to a 10-minute screenshare where I can walk you through the live n8n workflow and AI agent?\n\nBest regards,\nDevraj`;
                    handleCopy(text, 'pitch');
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {copiedKey === 'pitch' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'pitch' ? 'Copied Pitch to Clipboard!' : 'Copy Proposal Pitch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer System Meta */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div>SmartCampus v3.0 Enterprise Architecture • ISO-9001 Compliant</div>
        <div className="flex items-center space-x-4">
          <Link href="/terminal" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Door Kiosk</Link>
          <Link href="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Dean Console</Link>
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Faculty Dashboard</Link>
          <Link href="/reports" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Audit Reports</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import {
  Mail, Pencil, Trash2, RefreshCw, Search, Plus, Eye, EyeOff,
  ChevronDown, ChevronRight, Save, X, Code, Tag, Clock
} from "lucide-react";
import { EmailEditor } from "@/components/email-editor";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  subject_template: string | null;
  html_body: string;
  trigger_event: string | null;
  is_active: boolean;
  variables: string[] | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "all", label: "All Templates" },
  { value: "auth", label: "Auth" },
  { value: "subscription", label: "Subscription" },
  { value: "inventory", label: "Inventory" },
  { value: "order", label: "Order" },
  { value: "support", label: "Support" },
  { value: "marketing", label: "Marketing" },
];

const CATEGORY_COLORS: Record<string, string> = {
  auth: "var(--glow-cyan)",
  subscription: "var(--glow-purple)",
  inventory: "#f97316",
  order: "var(--glow-green)",
  support: "#3b82f6",
  marketing: "#eab308",
};

export default function AdminEmails() {
  const { error: showError, success: showSuccess, confirm: showConfirm } = useAlert();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", slug: "", description: "", category: "transactional", subject_template: "", trigger_event: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) setTemplates(await res.json());
    } catch { showError("Failed to load templates"); }
    setLoading(false);
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: template.id, is_active: !template.is_active }),
      });
      if (!res.ok) throw new Error();
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t));
      showSuccess(template.is_active ? "Template disabled" : "Template enabled");
    } catch { showError("Failed to update template"); }
  };

  const deleteTemplate = async (template: EmailTemplate) => {
    const confirmed = await showConfirm({
      title: "Delete template",
      message: `Permanently delete "${template.name}"? This cannot be undone.`,
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/email-templates?id=${template.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      showSuccess("Template deleted");
    } catch { showError("Failed to delete template"); }
  };

  const openEditor = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const saveEditorHtml = async (html: string) => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTemplate.id, html_body: html }),
      });
      if (!res.ok) throw new Error();
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, html_body: html } : t));
      setShowEditor(false);
      setEditingTemplate(null);
      showSuccess("Template saved");
    } catch { showError("Failed to save template"); }
    setSaving(false);
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.slug.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          html_body: "<!-- Start editing with the visual editor -->",
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTemplates(prev => [...prev, created]);
      setShowCreateModal(false);
      setNewTemplate({ name: "", slug: "", description: "", category: "transactional", subject_template: "", trigger_event: "" });
      showSuccess("Template created");
    } catch { showError("Failed to create template"); }
    setSaving(false);
  };

  const filtered = templates.filter(t => {
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()) || (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const grouped = CATEGORIES.filter(c => c.value !== "all").reduce((acc, cat) => {
    acc[cat.value] = filtered.filter(t => t.category === cat.value);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const activeCount = templates.filter(t => t.is_active).length;

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: isMobile ? "0 0.75rem" : "0 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={20} style={{ color: "var(--glow-purple)" }} /> Email Templates
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {templates.length} templates · {activeCount} active
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
          <Plus size={14} /> New Template
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "12rem", position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="ambient-input"
            style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }}
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="ambient-input"
          style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", minWidth: "10rem" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Template List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
          <Mail size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {search || categoryFilter !== "all" ? "No templates match your filters" : "No templates yet"}
          </p>
        </div>
      ) : categoryFilter === "all" ? (
        Object.entries(grouped).map(([cat, catTemplates]) => {
          if (catTemplates.length === 0) return null;
          const isExpanded = expandedId === cat || catTemplates.some(t => expandedId === t.id);
          return (
            <div key={cat} style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => setExpandedId(expandedId === cat ? null : cat)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", width: "100%",
                  padding: "0.625rem 0.875rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                  borderRadius: "0.5rem", cursor: "pointer", color: "var(--text-primary)", fontSize: "0.8125rem", fontWeight: 600,
                }}
              >
                {expandedId === cat ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: CATEGORY_COLORS[cat] || "var(--text-muted)" }} />
                {CATEGORIES.find(c => c.value === cat)?.label}
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 400 }}>({catTemplates.length})</span>
              </button>
              {(expandedId === cat || catTemplates.some(t => expandedId === t.id)) && (
                <div style={{ marginTop: "0.375rem", display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: "1.5rem" }}>
                  {catTemplates.map(t => (
                    <TemplateRow key={t.id} template={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onEdit={() => openEditor(t)} onToggleActive={() => toggleActive(t)} onDelete={() => deleteTemplate(t)} isMobile={isMobile} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {filtered.map(t => (
            <TemplateRow key={t.id} template={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onEdit={() => openEditor(t)} onToggleActive={() => toggleActive(t)} onDelete={() => deleteTemplate(t)} isMobile={isMobile} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowCreateModal(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "28rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>New Email Template</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <form onSubmit={createTemplate} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Name *</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. Welcome Email" value={newTemplate.name} onChange={(e) => setNewTemplate(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Slug *</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. welcome-email" value={newTemplate.slug} onChange={(e) => setNewTemplate(p => ({ ...p, slug: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Description</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="Brief description" value={newTemplate.description} onChange={(e) => setNewTemplate(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Category</label>
                  <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={newTemplate.category} onChange={(e) => setNewTemplate(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c.value !== "all").map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Trigger Event</label>
                  <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. auth.welcome" value={newTemplate.trigger_event} onChange={(e) => setNewTemplate(p => ({ ...p, trigger_event: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Subject Template</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. Welcome to {{platform_name}}!" value={newTemplate.subject_template} onChange={(e) => setNewTemplate(p => ({ ...p, subject_template: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} className="glow-button" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: saving ? 0.5 : 1 }}>{saving ? "Creating..." : "Create Template"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Editor */}
      {showEditor && editingTemplate && (
        <EmailEditor
          initialHtml={editingTemplate.html_body}
          onSave={saveEditorHtml}
          onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
        />
      )}
    </div>
  );
}

function TemplateRow({ template, expanded, onToggle, onEdit, onToggleActive, onDelete, isMobile }: {
  template: EmailTemplate;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isMobile: boolean;
}) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.75rem", cursor: "pointer" }} onClick={onToggle}>
        <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem", background: `${CATEGORY_COLORS[template.category] || "var(--text-muted)"}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Mail size={10} style={{ color: CATEGORY_COLORS[template.category] || "var(--text-muted)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{template.slug}</div>
        </div>
        {template.trigger_event && (
          <div style={{ display: isMobile ? "none" : "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.625rem", color: "var(--text-muted)" }}>
            <Clock size={10} />
            {template.trigger_event}
          </div>
        )}
        <div style={{
          padding: "0.125rem 0.5rem", borderRadius: "1rem", fontSize: "0.5625rem", fontWeight: 600,
          background: template.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: template.is_active ? "var(--glow-green)" : "var(--glow-red)",
          border: `1px solid ${template.is_active ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          {template.is_active ? "Active" : "Inactive"}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.15)" }}>
          {template.description && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{template.description}</p>
          )}
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", borderRadius: "0.375rem", border: "1px solid var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)", cursor: "pointer" }}>
              <Pencil size={10} /> Edit HTML
            </button>
            <button onClick={onToggleActive} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", borderRadius: "0.375rem", border: "1px solid var(--border-subtle)", background: "var(--bg-primary)", color: template.is_active ? "var(--glow-red)" : "var(--glow-green)", cursor: "pointer" }}>
              {template.is_active ? <><EyeOff size={10} /> Disable</> : <><Eye size={10} /> Enable</>}
            </button>
            <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "var(--glow-red)", cursor: "pointer" }}>
              <Trash2 size={10} /> Delete
            </button>
          </div>
          {template.variables && template.variables.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Variables</div>
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                {template.variables.map((v, i) => (
                  <span key={i} style={{ padding: "0.125rem 0.5rem", fontSize: "0.5625rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)", borderRadius: "0.25rem", color: "var(--glow-purple)", fontFamily: "monospace" }}>
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

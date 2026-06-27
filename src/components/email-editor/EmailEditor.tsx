"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import {
  Type, Image, MousePointer2, Square, Minus, Space, Save, Eye, Undo2, Redo2,
  Trash2, Copy, MoveUp, MoveDown, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Palette, ChevronDown, X, Layers, Download, Code, PanelLeftOpen, PanelRightOpen
} from "lucide-react";
import { EmailElement, EditorState } from "./types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

let nextId = 1;
function genId() { return `el_${nextId++}_${Date.now()}`; }

const DEFAULT_STYLE: Record<string, any> = {
  fontSize: 16,
  fontFamily: "Arial, sans-serif",
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  textAlign: "left",
  color: "#e0e0e0",
  backgroundColor: "transparent",
  borderRadius: 0,
  border: "none",
  padding: 0,
  lineHeight: 1.5,
};

function createTextElement(x = 40, y = 40): EmailElement {
  return { id: genId(), type: "text", x, y, width: 400, height: 40, rotation: 0, opacity: 1, locked: false, style: { ...DEFAULT_STYLE }, content: "Double-click to edit text" };
}
function createImageElement(x = 40, y = 40): EmailElement {
  return { id: genId(), type: "image", x, y, width: 200, height: 150, rotation: 0, opacity: 1, locked: false, style: { borderRadius: 8 }, src: "" };
}
function createButtonElement(x = 40, y = 40): EmailElement {
  return { id: genId(), type: "button", x, y, width: 200, height: 48, rotation: 0, opacity: 1, locked: false, style: { ...DEFAULT_STYLE, backgroundColor: "#a855f7", color: "#ffffff", borderRadius: 8, textAlign: "center", fontWeight: "bold", fontSize: 14 }, content: "Click Me", href: "#" };
}
function createDividerElement(x = 40, y = 40): EmailElement {
  return { id: genId(), type: "divider", x, y, width: 400, height: 2, rotation: 0, opacity: 1, locked: false, style: { backgroundColor: "#334155", borderStyle: "solid" }, content: "" };
}
function createSpacerElement(x = 40, y = 40): EmailElement {
  return { id: genId(), type: "spacer", x, y, width: 400, height: 32, rotation: 0, opacity: 1, locked: false, style: {}, content: "" };
}
function createShapeElement(x = 40, y = 40): EmailElement {
  return { id: genId(), type: "shape", x, y, width: 120, height: 120, rotation: 0, opacity: 1, locked: false, style: { backgroundColor: "rgba(168,133,247,0.3)", borderRadius: 12, border: "1px solid rgba(168,133,247,0.5)" }, content: "" };
}

interface EmailEditorProps {
  initialHtml?: string;
  onSave: (html: string) => void;
  onClose: () => void;
}

export default function EmailEditor({ initialHtml, onSave, onClose }: EmailEditorProps) {
  const { error: showError, success: showSuccess } = useAlert();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<EditorState>({
    elements: [], selectedId: null, zoom: 1, canvasWidth: 600, canvasHeight: 800, backgroundColor: "#0a0a12",
  });
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: string; startX: number; startY: number; w: number; h: number; x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState("");
  const [showToolbox, setShowToolbox] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const pushHistory = useCallback((s: EditorState) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), { ...s, elements: s.elements.map(e => ({ ...e })) }]);
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setState(prev);
    setHistoryIdx(i => i - 1);
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const next = history[historyIdx + 1];
    setState(next);
    setHistoryIdx(i => i + 1);
  }, [history, historyIdx]);

  const addElement = useCallback((el: EmailElement) => {
    setState(s => {
      const next = { ...s, elements: [...s.elements, el], selectedId: el.id };
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const updateElement = useCallback((id: string, updates: Partial<EmailElement>) => {
    setState(s => {
      const elements = s.elements.map(e => e.id === id ? { ...e, ...updates } : e);
      return { ...s, elements };
    });
  }, []);

  const commitUpdate = useCallback(() => {
    setState(s => { pushHistory(s); return s; });
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!state.selectedId) return;
    setState(s => {
      const next = { ...s, elements: s.elements.filter(e => e.id !== s.selectedId), selectedId: null };
      pushHistory(next);
      return next;
    });
  }, [state.selectedId, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (!state.selectedId) return;
    const el = state.elements.find(e => e.id === state.selectedId);
    if (!el) return;
    const clone = { ...el, id: genId(), x: el.x + 20, y: el.y + 20 };
    addElement(clone);
  }, [state.selectedId, state.elements, addElement]);

  const bringForward = useCallback(() => {
    if (!state.selectedId) return;
    setState(s => {
      const idx = s.elements.findIndex(e => e.id === s.selectedId);
      if (idx < s.elements.length - 1) {
        const els = [...s.elements];
        [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
        return { ...s, elements: els };
      }
      return s;
    });
  }, [state.selectedId]);

  const sendBackward = useCallback(() => {
    if (!state.selectedId) return;
    setState(s => {
      const idx = s.elements.findIndex(e => e.id === s.selectedId);
      if (idx > 0) {
        const els = [...s.elements];
        [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
        return { ...s, elements: els };
      }
      return s;
    });
  }, [state.selectedId]);

  const selectedEl = state.elements.find(e => e.id === state.selectedId);

  // Canvas mouse handlers
  const onCanvasMouseDown = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    const el = state.elements.find(x => x.id === elId);
    if (!el || el.locked) return;
    setState(s => ({ ...s, selectedId: elId }));
    setDragging({ id: elId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  }, [state.elements]);

  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / state.zoom;
      const dy = (e.clientY - dragging.startY) / state.zoom;
      updateElement(dragging.id, { x: Math.round(dragging.elX + dx), y: Math.round(dragging.elY + dy) });
    }
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / state.zoom;
      const dy = (e.clientY - resizing.startY) / state.zoom;
      let w = resizing.w, h = resizing.h, x = resizing.x, y = resizing.y;
      if (resizing.handle.includes("e")) w = Math.max(20, resizing.w + dx);
      if (resizing.handle.includes("s")) h = Math.max(20, resizing.h + dy);
      if (resizing.handle.includes("w")) { w = Math.max(20, resizing.w - dx); x = resizing.x + dx; }
      if (resizing.handle.includes("n")) { h = Math.max(20, resizing.h - dy); y = resizing.y + dy; }
      updateElement(resizing.id, { width: Math.round(w), height: Math.round(h), x: Math.round(x), y: Math.round(y) });
    }
  }, [dragging, resizing, state.zoom, updateElement]);

  const onCanvasMouseUp = useCallback(() => {
    if (dragging || resizing) commitUpdate();
    setDragging(null);
    setResizing(null);
  }, [dragging, resizing, commitUpdate]);

  const onResizeStart = useCallback((e: React.MouseEvent, elId: string, handle: string) => {
    e.stopPropagation();
    const el = state.elements.find(x => x.id === elId);
    if (!el || el.locked) return;
    setState(s => ({ ...s, selectedId: elId }));
    setResizing({ id: elId, handle, startX: e.clientX, startY: e.clientY, w: el.width, h: el.height, x: el.x, y: el.y });
  }, [state.elements]);

  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-element]")) return;
    setState(s => ({ ...s, selectedId: null }));
  }, []);

  const onDoubleClick = useCallback((elId: string) => {
    const el = state.elements.find(e => e.id === elId);
    if (el?.type === "text" || el?.type === "button") {
      setEditingId(elId);
    }
  }, [state.elements]);

  const finishEditing = useCallback(() => {
    if (editingId && textRef.current) {
      updateElement(editingId, { content: textRef.current.value });
      commitUpdate();
    }
    setEditingId(null);
  }, [editingId, updateElement, commitUpdate]);

  // Generate HTML
  const generateHtml = useCallback(() => {
    const { elements, canvasWidth, canvasHeight, backgroundColor } = state;
    let bodyContent = "";
    for (const el of elements) {
      const pos = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;opacity:${el.opacity};transform:rotate(${el.rotation}deg);`;
      const s = el.style;
      switch (el.type) {
        case "text":
          bodyContent += `<div style="${pos}font-size:${s.fontSize}px;font-family:${s.fontFamily};font-weight:${s.fontWeight};font-style:${s.fontStyle};text-decoration:${s.textDecoration};text-align:${s.textAlign};color:${s.color};background:${s.backgroundColor};border-radius:${s.borderRadius}px;border:${s.border};padding:${s.padding}px;line-height:${s.lineHeight};box-sizing:border-box;">${el.content || ""}</div>\n`;
          break;
        case "image":
          bodyContent += el.src ? `<img src="${el.src}" style="${pos}object-fit:cover;border-radius:${s.borderRadius || 0}px;" />\n` : `<div style="${pos}background:#1e293b;border-radius:${s.borderRadius || 0}px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;">Image</div>\n`;
          break;
        case "button":
          bodyContent += `<a href="${el.href || "#"}" style="${pos}display:flex;align-items:center;justify-content:center;font-size:${s.fontSize}px;font-family:${s.fontFamily};font-weight:${s.fontWeight};color:${s.color};background:${s.backgroundColor};border-radius:${s.borderRadius}px;text-decoration:none;text-align:center;">${el.content || "Button"}</a>\n`;
          break;
        case "divider":
          bodyContent += `<hr style="${pos}border:none;border-top:${el.height}px ${s.borderStyle || "solid"} ${s.backgroundColor};margin:0;" />\n`;
          break;
        case "spacer":
          bodyContent += `<div style="${pos}"></div>\n`;
          break;
        case "shape":
          bodyContent += `<div style="${pos}background:${s.backgroundColor};border-radius:${s.borderRadius}px;border:${s.border};box-sizing:border-box;"></div>\n`;
          break;
      }
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#06060b;"><div style="position:relative;width:${canvasWidth}px;height:${canvasHeight}px;background:${backgroundColor};margin:0 auto;font-family:Arial,sans-serif;">\n${bodyContent}</div></body></html>`;
  }, [state]);

  const handleSave = useCallback(() => {
    const html = generateHtml();
    onSave(html);
    showSuccess("Email template saved");
  }, [generateHtml, onSave, showSuccess]);

  const handlePreview = useCallback(() => {
    setHtmlPreview(generateHtml());
    setShowHtml(true);
  }, [generateHtml]);

  const handleExportHtml = useCallback(() => {
    const html = generateHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-template.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [generateHtml]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === "d") { e.preventDefault(); duplicateSelected(); }
      if (state.selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const el = state.elements.find(x => x.id === state.selectedId);
        if (!el) return;
        const updates: Partial<EmailElement> = {};
        if (e.key === "ArrowUp") updates.y = el.y - step;
        if (e.key === "ArrowDown") updates.y = el.y + step;
        if (e.key === "ArrowLeft") updates.x = el.x - step;
        if (e.key === "ArrowRight") updates.x = el.x + step;
        updateElement(state.selectedId, updates);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, deleteSelected, undo, redo, duplicateSelected, state.selectedId, state.elements, updateElement]);

  const toolboxItems = [
    { type: "text", icon: Type, label: "Text" },
    { type: "image", icon: Image, label: "Image" },
    { type: "button", icon: MousePointer2, label: "Button" },
    { type: "divider", icon: Minus, label: "Divider" },
    { type: "spacer", icon: Space, label: "Spacer" },
    { type: "shape", icon: Square, label: "Shape" },
  ] as const;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Top toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0.375rem 0.5rem" : "0.5rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", flexShrink: 0, gap: "0.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isMobile && (
            <button onClick={() => setShowToolbox(!showToolbox)} style={{ padding: "0.375rem", background: showToolbox ? "rgba(168,133,247,0.1)" : "none", border: "none", color: showToolbox ? "var(--glow-purple)" : "var(--text-muted)", cursor: "pointer", borderRadius: "0.25rem" }} title="Elements"><PanelLeftOpen size={16} /></button>
          )}
          <h2 style={{ fontSize: isMobile ? "0.75rem" : "0.875rem", fontWeight: 700 }}>Email Editor</h2>
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", padding: "0.125rem 0.5rem", background: "var(--bg-primary)", borderRadius: "1rem" }}>{state.elements.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.125rem" : "0.25rem" }}>
          <button onClick={undo} disabled={historyIdx <= 0} style={{ padding: "0.375rem", background: "none", border: "none", color: historyIdx <= 0 ? "var(--text-muted)" : "var(--text-secondary)", cursor: "pointer", borderRadius: "0.25rem" }} title="Undo"><Undo2 size={isMobile ? 14 : 16} /></button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} style={{ padding: "0.375rem", background: "none", border: "none", color: historyIdx >= history.length - 1 ? "var(--text-muted)" : "var(--text-secondary)", cursor: "pointer", borderRadius: "0.25rem" }} title="Redo"><Redo2 size={isMobile ? 14 : 16} /></button>
          {!isMobile && <div style={{ width: "1px", height: "1.25rem", background: "var(--border-subtle)", margin: "0 0.25rem" }} />}
          {!isMobile && <button onClick={handlePreview} style={{ padding: "0.375rem 0.625rem", fontSize: "0.6875rem", background: "none", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "0.375rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Eye size={14} /> Preview</button>}
          {!isMobile && <button onClick={handleExportHtml} style={{ padding: "0.375rem 0.625rem", fontSize: "0.6875rem", background: "none", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "0.375rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Code size={14} /> HTML</button>}
          {isMobile && <button onClick={handlePreview} style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "0.25rem" }} title="Preview"><Eye size={14} /></button>}
          {isMobile && <button onClick={handleExportHtml} style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "0.25rem" }} title="HTML"><Code size={14} /></button>}
          <button onClick={handleSave} className="glow-button" style={{ padding: isMobile ? "0.375rem 0.5rem" : "0.375rem 0.75rem", fontSize: "0.6875rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Save size={14} /> {!isMobile && "Save"}</button>
          <button onClick={onClose} style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
          {isMobile && (
            <button onClick={() => setShowProperties(!showProperties)} style={{ padding: "0.375rem", background: showProperties ? "rgba(168,133,247,0.1)" : "none", border: "none", color: showProperties ? "var(--glow-purple)" : "var(--text-muted)", cursor: "pointer", borderRadius: "0.25rem" }} title="Properties"><PanelRightOpen size={16} /></button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Left toolbox - hidden on mobile unless toggled */}
        {(!isMobile || showToolbox) && (
          <div style={{ width: isMobile ? "3rem" : "3.5rem", borderRight: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", display: "flex", flexDirection: "column", alignItems: "center", padding: "0.5rem 0", gap: "0.25rem", flexShrink: 0, ...(isMobile ? { position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 20, boxShadow: "4px 0 16px rgba(0,0,0,0.3)" } : {}) }}>
            {toolboxItems.map(item => (
              <button key={item.type} onClick={() => { addElement(item.type === "text" ? createTextElement() : item.type === "image" ? createImageElement() : item.type === "button" ? createButtonElement() : item.type === "divider" ? createDividerElement() : item.type === "spacer" ? createSpacerElement() : createShapeElement()); if (isMobile) setShowToolbox(false); }} title={item.label} style={{ width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,133,247,0.1)"; e.currentTarget.style.color = "var(--glow-purple)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                <item.icon size={16} />
              </button>
            ))}
            <div style={{ width: "1.5rem", height: "1px", background: "var(--border-subtle)", margin: "0.25rem 0" }} />
            <button onClick={duplicateSelected} disabled={!state.selectedId} title="Duplicate" style={{ width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: state.selectedId ? "var(--text-muted)" : "var(--text-muted)", opacity: state.selectedId ? 1 : 0.4, cursor: state.selectedId ? "pointer" : "default" }}><Copy size={14} /></button>
            <button onClick={deleteSelected} disabled={!state.selectedId} title="Delete" style={{ width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--glow-red)", opacity: state.selectedId ? 1 : 0.4, cursor: state.selectedId ? "pointer" : "default" }}><Trash2 size={14} /></button>
          </div>
        )}

        {/* Canvas area */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: isMobile ? "0.75rem" : "1.5rem", background: "var(--bg-primary)" }}>
          <div
            ref={canvasRef}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={onCanvasMouseUp}
            onClick={onCanvasClick}
            style={{
              position: "relative",
              width: state.canvasWidth,
              height: state.canvasHeight,
              background: state.backgroundColor,
              borderRadius: "0.5rem",
              boxShadow: "0 0 0 1px var(--border-subtle), 0 8px 32px rgba(0,0,0,0.3)",
              transform: `scale(${isMobile ? Math.min(state.zoom, 0.5) : state.zoom})`,
              transformOrigin: "top center",
              flexShrink: 0,
            }}
          >
            {state.elements.map(el => {
              const isSelected = state.selectedId === el.id;
              const resizeHandles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
              return (
                <div
                  key={el.id}
                  data-element={el.id}
                  onMouseDown={(e) => onCanvasMouseDown(e, el.id)}
                  onDoubleClick={() => onDoubleClick(el.id)}
                  style={{
                    position: "absolute",
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    opacity: el.opacity,
                    transform: `rotate(${el.rotation}deg)`,
                    cursor: el.locked ? "not-allowed" : "move",
                    outline: isSelected ? "2px solid var(--glow-purple)" : "none",
                    outlineOffset: "1px",
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  {/* Element content */}
                  {el.type === "text" && (
                    editingId === el.id ? (
                      <textarea ref={textRef} autoFocus defaultValue={el.content || ""} onBlur={finishEditing} onKeyDown={e => { if (e.key === "Escape") finishEditing(); }} style={{ width: "100%", height: "100%", resize: "none", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glow-purple)", borderRadius: "0.25rem", color: el.style.color, fontSize: el.style.fontSize, fontFamily: el.style.fontFamily, fontWeight: el.style.fontWeight, fontStyle: el.style.fontStyle, textAlign: el.style.textAlign, lineHeight: el.style.lineHeight, padding: el.style.padding, boxSizing: "border-box", outline: "none" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", overflow: "hidden", fontSize: el.style.fontSize, fontFamily: el.style.fontFamily, fontWeight: el.style.fontWeight, fontStyle: el.style.fontStyle, textDecoration: el.style.textDecoration, textAlign: el.style.textAlign, color: el.style.color, background: el.style.backgroundColor, borderRadius: el.style.borderRadius, border: el.style.border, padding: el.style.padding, lineHeight: el.style.lineHeight, boxSizing: "border-box", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{el.content}</div>
                    )
                  )}
                  {el.type === "image" && (
                    el.src ? <img src={el.src} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: el.style.borderRadius }} /> : <div style={{ width: "100%", height: "100%", background: "#1e293b", borderRadius: el.style.borderRadius, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "12px" }}><Image size={20} /></div>
                  )}
                  {el.type === "button" && (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: el.style.backgroundColor, color: el.style.color, borderRadius: el.style.borderRadius, fontSize: el.style.fontSize, fontWeight: el.style.fontWeight, fontFamily: el.style.fontFamily, cursor: "pointer" }}>{el.content}</div>
                  )}
                  {el.type === "divider" && <div style={{ width: "100%", height: "100%", borderTop: `${el.height}px ${el.style.borderStyle || "solid"} ${el.style.backgroundColor}` }} />}
                  {el.type === "spacer" && <div style={{ width: "100%", height: "100%", background: "rgba(168,133,247,0.05)", border: "1px dashed rgba(168,133,247,0.2)" }} />}
                  {el.type === "shape" && <div style={{ width: "100%", height: "100%", background: el.style.backgroundColor, borderRadius: el.style.borderRadius, border: el.style.border }} />}

                  {/* Resize handles */}
                  {isSelected && !el.locked && resizeHandles.map(h => (
                    <div key={h} onMouseDown={(e) => onResizeStart(e, el.id, h)} style={{
                      position: "absolute",
                      width: h === "n" || h === "s" ? "1rem" : "0.5rem",
                      height: h === "e" || h === "w" ? "1rem" : "0.5rem",
                      background: "var(--glow-purple)",
                      border: "1px solid var(--bg-primary)",
                      borderRadius: "0.125rem",
                      cursor: h === "n" || h === "s" ? "ns-resize" : h === "e" || h === "w" ? "ew-resize" : `${h}-resize`,
                      ...(h === "nw" ? { top: -4, left: -4 } : h === "ne" ? { top: -4, right: -4 } : h === "sw" ? { bottom: -4, left: -4 } : h === "se" ? { bottom: -4, right: -4 } : h === "n" ? { top: -4, left: "50%", transform: "translateX(-50%)" } : h === "s" ? { bottom: -4, left: "50%", transform: "translateX(-50%)" } : h === "e" ? { top: "50%", right: -4, transform: "translateY(-50%)" } : { top: "50%", left: -4, transform: "translateY(-50%)" }),
                    }} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right properties panel - hidden on mobile unless toggled */}
        {(!isMobile || showProperties) && (
          <div style={{ width: isMobile ? "100%" : "14rem", ...(isMobile ? { position: "absolute", right: 0, top: 0, bottom: 0, zIndex: 20, boxShadow: "-4px 0 16px rgba(0,0,0,0.3)", maxWidth: "14rem" } : { borderLeft: "1px solid var(--border-subtle)" }), borderLeft: isMobile ? "none" : "1px solid var(--border-subtle)", background: "var(--bg-secondary)", overflowY: "auto", flexShrink: 0 }}>
            {selectedEl ? (
              <PropertiesPanel element={selectedEl} onUpdate={(updates) => { updateElement(selectedEl.id, updates); commitUpdate(); }} />
            ) : (
              <CanvasProperties state={state} setState={setState} />
            )}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {showHtml && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setShowHtml(false)} />
          <div style={{ position: "relative", width: "100%", maxWidth: "50rem", maxHeight: "90vh", background: "var(--bg-secondary)", borderRadius: "0.75rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>{showHtml ? "HTML Source" : "Preview"}</h3>
              <button onClick={() => setShowHtml(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
              <pre style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{htmlPreview}</pre>
            </div>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => { navigator.clipboard.writeText(htmlPreview); showSuccess("HTML copied"); }} style={{ padding: "0.375rem 0.75rem", fontSize: "0.6875rem", background: "var(--glow-purple)", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>Copy HTML</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Properties Panel ─────────────────────────────── */
function PropertiesPanel({ element, onUpdate }: { element: EmailElement; onUpdate: (updates: Partial<EmailElement>) => void }) {
  const s = element.style;
  const updateStyle = (key: string, value: any) => onUpdate({ style: { ...s, [key]: value } });

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>{element.type}</h3>
        <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>#{element.id.slice(0, 6)}</div>
      </div>

      {/* Position */}
      <Section title="Position">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
          <NumberInput label="X" value={element.x} onChange={v => onUpdate({ x: v })} />
          <NumberInput label="Y" value={element.y} onChange={v => onUpdate({ y: v })} />
          <NumberInput label="W" value={element.width} onChange={v => onUpdate({ width: v })} min={10} />
          <NumberInput label="H" value={element.height} onChange={v => onUpdate({ height: v })} min={10} />
        </div>
        <NumberInput label="Rotation" value={element.rotation} onChange={v => onUpdate({ rotation: v })} min={-360} max={360} />
        <SliderInput label="Opacity" value={element.opacity} onChange={v => onUpdate({ opacity: v })} min={0} max={1} step={0.05} />
      </Section>

      {/* Text styling */}
      {(element.type === "text" || element.type === "button") && (
        <Section title="Text">
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <IconButton icon={<Bold size={12} />} active={s.fontWeight === "bold"} onClick={() => updateStyle("fontWeight", s.fontWeight === "bold" ? "normal" : "bold")} />
            <IconButton icon={<Italic size={12} />} active={s.fontStyle === "italic"} onClick={() => updateStyle("fontStyle", s.fontStyle === "italic" ? "normal" : "italic")} />
            <IconButton icon={<Underline size={12} />} active={s.textDecoration === "underline"} onClick={() => updateStyle("textDecoration", s.textDecoration === "underline" ? "none" : "underline")} />
          </div>
          <NumberInput label="Font Size" value={s.fontSize} onChange={v => updateStyle("fontSize", v)} min={8} max={72} />
          <select value={s.fontFamily} onChange={e => updateStyle("fontFamily", e.target.value)} style={{ width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.6875rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.375rem", color: "var(--text-secondary)" }}>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="Tahoma, sans-serif">Tahoma</option>
          </select>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <IconButton icon={<AlignLeft size={12} />} active={s.textAlign === "left"} onClick={() => updateStyle("textAlign", "left")} />
            <IconButton icon={<AlignCenter size={12} />} active={s.textAlign === "center"} onClick={() => updateStyle("textAlign", "center")} />
            <IconButton icon={<AlignRight size={12} />} active={s.textAlign === "right"} onClick={() => updateStyle("textAlign", "right")} />
          </div>
          <ColorInput label="Color" value={s.color} onChange={v => updateStyle("color", v)} />
        </Section>
      )}

      {/* Appearance */}
      <Section title="Appearance">
        <ColorInput label="Background" value={s.backgroundColor} onChange={v => updateStyle("backgroundColor", v)} />
        <NumberInput label="Border Radius" value={s.borderRadius} onChange={v => updateStyle("borderRadius", v)} min={0} max={100} />
        {(element.type === "text" || element.type === "button") && (
          <NumberInput label="Padding" value={s.padding} onChange={v => updateStyle("padding", v)} min={0} max={50} />
        )}
        {element.type === "text" && (
          <SliderInput label="Line Height" value={s.lineHeight} onChange={v => updateStyle("lineHeight", v)} min={1} max={3} step={0.1} />
        )}
      </Section>

      {/* Layer */}
      <Section title="Layer">
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <SmallButton icon={<MoveUp size={12} />} label="Up" />
          <SmallButton icon={<MoveDown size={12} />} label="Down" />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--text-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={element.locked} onChange={e => onUpdate({ locked: e.target.checked })} style={{ accentColor: "var(--glow-purple)" }} />
          Lock position
        </label>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <h4 style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h4>
      {children}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", width: "1.25rem", flexShrink: 0 }}>{label}</span>
      <input type="number" value={Math.round(value)} onChange={e => onChange(parseInt(e.target.value) || 0)} min={min} max={max} style={{ flex: 1, padding: "0.25rem 0.375rem", fontSize: "0.6875rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.25rem", color: "var(--text-secondary)", width: "100%" }} />
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: "var(--glow-purple)" }} />
      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", width: "1.5rem", textAlign: "right" }}>{typeof value === "number" ? (value < 1 ? Math.round(value * 100) + "%" : value.toFixed(1)) : value}</span>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <input type="color" value={value?.startsWith("#") ? value : "#000000"} onChange={e => onChange(e.target.value)} style={{ width: "1.25rem", height: "1.25rem", padding: 0, border: "1px solid var(--border-subtle)", borderRadius: "0.25rem", cursor: "pointer", background: "none" }} />
        <input type="text" value={value || ""} onChange={e => onChange(e.target.value)} style={{ flex: 1, padding: "0.25rem 0.375rem", fontSize: "0.625rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.25rem", color: "var(--text-secondary)" }} />
      </div>
    </div>
  );
}

function IconButton({ icon, active, onClick }: { icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem", border: `1px solid ${active ? "var(--glow-purple)" : "var(--border-subtle)"}`, background: active ? "rgba(168,133,247,0.1)" : "transparent", color: active ? "var(--glow-purple)" : "var(--text-muted)", cursor: "pointer" }}>
      {icon}
    </button>
  );
}

function SmallButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", padding: "0.375rem", fontSize: "0.625rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.375rem", color: "var(--text-muted)", cursor: "pointer" }}>
      {icon} {label}
    </button>
  );
}

function CanvasProperties({ state, setState }: { state: EditorState; setState: React.Dispatch<React.SetStateAction<EditorState>> }) {
  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>Canvas</h3>
      <NumberInput label="Width" value={state.canvasWidth} onChange={v => setState(s => ({ ...s, canvasWidth: v }))} min={200} max={1200} />
      <NumberInput label="Height" value={state.canvasHeight} onChange={v => setState(s => ({ ...s, canvasHeight: v }))} min={200} max={3000} />
      <ColorInput label="Background" value={state.backgroundColor} onChange={v => setState(s => ({ ...s, backgroundColor: v }))} />
      <SliderInput label="Zoom" value={state.zoom} onChange={v => setState(s => ({ ...s, zoom: v }))} min={0.25} max={2} step={0.1} />
    </div>
  );
}

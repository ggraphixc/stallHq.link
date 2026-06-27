export interface EmailElement {
  id: string;
  type: "text" | "image" | "button" | "divider" | "shape" | "spacer" | "columns";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  style: Record<string, any>;
  content?: string;
  src?: string;
  href?: string;
}

export interface EditorTool {
  id: string;
  label: string;
  icon: string;
  category: "add" | "style" | "align" | "arrange";
}

export interface EditorState {
  elements: EmailElement[];
  selectedId: string | null;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
}

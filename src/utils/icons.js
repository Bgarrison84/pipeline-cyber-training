// src/utils/icons.js
// Centralises Lucide icon activation so that main.js, router.js, sidebar.js,
// and lesson-view.js can all import activateIcons without forming a circular
// dependency triangle through main.js.

import {
  createIcons,
  BookOpen,
  Shield,
  ShieldCheck,
  Users,
  AlertTriangle,
  Wrench,
  ChevronLeft,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  XCircle,
  Terminal,
  Circle,
  Monitor,
  HelpCircle,
  GitBranch,
  FileX,
  Printer,
} from 'lucide';

export function activateIcons() {
  createIcons({
    icons: { BookOpen, Shield, ShieldCheck, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle, CheckCircle, XCircle, Terminal, Circle, Monitor, HelpCircle, GitBranch, FileX, Printer },
  });
}

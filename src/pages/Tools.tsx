import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';
import { 
  Palette, Layers, GraduationCap, Network, Calendar, Target, 
  Binary, Compass, Sparkles, X, Undo2, ChevronLeft, ChevronRight, 
  Plus, Trash2, Edit2, Play, CheckCircle2, Trophy, ArrowRight,
  Eye, CornerDownRight, Move, Search, HelpCircle, Dumbbell, Star, AlertCircle, RefreshCcw, Save, Trash, Award, ShieldAlert, Check,
  BookOpen, Upload
} from 'lucide-react';

/* ==========================================
   PERSISTENCE TYPES & CONSTANTS
   ========================================== */

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface Quiz {
  title: string;
  questions: Question[];
}

interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface MindLink {
  fromId: string;
  toId: string;
}

interface StudyPlannerSet {
  [day: string]: {
    morning: string;
    afternoon: string;
    evening: string;
  };
}

interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

interface FormulaItem {
  id: string;
  title: string;
  equation: string;
  description: string;
  category: string;
}

interface RevisionTopic {
  id: string;
  topic: string;
  mastery: number; // 0 - 100
  reviewed: boolean;
  lastReviewedDate: string;
}

export function Tools() {
  const { user, guestUser } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';

  // Toggle Overlays for each of the 9 distinct tools
  const [activeOverlay, setActiveOverlay] = useState<
    'whiteboard' | 'flashcards' | 'quiz' | 'mindmap' | 'planner' | 'goals' | 'formulas' | 'revision' | 'pdf_viewer' | null
  >(null);

  /* ==========================================
     9. ADOBE PDF SCHOLAR STATE & ACTION ENGINE
     ========================================== */
  const [pdfUrl, setPdfUrl] = useState<string>('https://arxiv.org/pdf/2303.10130.pdf'); // State-of-the-art AI paper default
  const [pdfNotes, setPdfNotes] = useState<string>(() => {
    return localStorage.getItem(`studyvibe_pdf_notes_${currentUserId}`) || '';
  });
  const [isPdfUrlInputOpen, setIsPdfUrlInputOpen] = useState<boolean>(false);
  const [tempPdfUrl, setTempPdfUrl] = useState<string>('');
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Sync pdf review notes dynamically
  useEffect(() => {
    localStorage.setItem(`studyvibe_pdf_notes_${currentUserId}`, pdfNotes);
  }, [pdfNotes, currentUserId]);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        alert("Please load a registered PDF book file format!");
        return;
      }
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  /* ==========================================
     1. WHITEBOARD CANVAS LOGIC
     ========================================== */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wbTool, setWbTool] = useState<'pencil' | 'eraser'>('pencil');
  const [wbColor, setWbColor] = useState('#8b5cf6'); // Neon Purple Arcane
  const [wbBrushSize, setWbBrushSize] = useState(5);
  const isDrawingRef = useRef(false);
  const [wbHistory, setWbHistory] = useState<string[]>([]);
  const [wbHistoryIdx, setWbHistoryIdx] = useState(-1);

  const initWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset dimensions inside the glass frame elegantly
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 500;
    
    // Fill deep cosmos dark background
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Auto-save initial background frame to history stack
    const initialFrame = canvas.toDataURL();
    setWbHistory([initialFrame]);
    setWbHistoryIdx(0);
  };

  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getCanvasTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const startWhiteboardDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = wbTool === 'eraser' ? '#0a0a10' : wbColor;
    ctx.lineWidth = wbBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const drawWhiteboard = (x: number, y: number) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopWhiteboardDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    // Capture to Undo/Redo historical indexers
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentFrame = canvas.toDataURL();
    const nextHistory = wbHistory.slice(0, wbHistoryIdx + 1);
    setWbHistory([...nextHistory, currentFrame]);
    setWbHistoryIdx(nextHistory.length);
  };

  const handleWbUndo = () => {
    if (wbHistoryIdx <= 0) return;
    const prevIdx = wbHistoryIdx - 1;
    restoreWhiteboardFrame(prevIdx);
  };

  const handleWbRedo = () => {
    if (wbHistoryIdx >= wbHistory.length - 1) return;
    const nextIdx = wbHistoryIdx + 1;
    restoreWhiteboardFrame(nextIdx);
  };

  const restoreWhiteboardFrame = (idx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = wbHistory[idx];
    img.onload = () => {
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setWbHistoryIdx(idx);
    };
  };

  const exportWbAsPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `StudyVibe_Whiteboard_Synthesis_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const freshFrame = canvas.toDataURL();
    setWbHistory([freshFrame]);
    setWbHistoryIdx(0);
  };

  /* ==========================================
     2. DYNAMIC FLASHCARDS LOGIC
     ========================================== */
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcNewFront, setFcNewFront] = useState('');
  const [fcNewBack, setFcNewBack] = useState('');
  const [showFcCreator, setShowFcCreator] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(`studyvibe_teaching_flashcards_${currentUserId}`);
    if (cached) {
      setFlashcards(JSON.parse(cached));
    } else {
      const defaults: Flashcard[] = [
        { id: 'fc_1', front: 'What is the Schrödinger Wave equation?', back: 'iℏ ∂/∂t Ψ(x,t) = [ -ℏ²/2m ∂²/∂x² + V(x,t) ] Ψ(x,t)' },
        { id: 'fc_2', front: 'State the Heisenberg Uncertainty Principle.', back: 'Δx · Δp ≥ ℏ/2' },
        { id: 'fc_3', front: 'What does the Planck constant measure?', back: 'The quantum of electromagnetic action, relating energy of photon of frequency.' }
      ];
      setFlashcards(defaults);
      localStorage.setItem(`studyvibe_teaching_flashcards_${currentUserId}`, JSON.stringify(defaults));
    }
  }, [currentUserId]);

  const saveFlashcards = (list: Flashcard[]) => {
    setFlashcards(list);
    localStorage.setItem(`studyvibe_teaching_flashcards_${currentUserId}`, JSON.stringify(list));
  };

  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcNewFront.trim() || !fcNewBack.trim()) return;

    const fresh: Flashcard = {
      id: `fc_${Date.now()}`,
      front: fcNewFront.trim(),
      back: fcNewBack.trim()
    };
    const nextList = [...flashcards, fresh];
    saveFlashcards(nextList);
    setFcNewFront('');
    setFcNewBack('');
    setShowFcCreator(false);
    setFcIndex(nextList.length - 1);
  };

  const handleDeleteFlashcard = (id: string) => {
    const nextList = flashcards.filter(f => f.id !== id);
    saveFlashcards(nextList);
    if (fcIndex >= nextList.length) {
      setFcIndex(Math.max(0, nextList.length - 1));
    }
    setFcFlipped(false);
  };

  /* ==========================================
     3. GAMIFIED QUIZ BUILDER LOGIC
     ========================================== */
  const [quiz, setQuiz] = useState<Quiz>({ title: 'Scholarly Quiz', questions: [] });
  const [qzMode, setQzMode] = useState<'create' | 'play' | 'score'>('create');
  const [qzNewTitle, setQzNewTitle] = useState('');
  const [qzNewQuestion, setQzNewQuestion] = useState('');
  const [qzNewOptions, setQzNewOptions] = useState<string[]>(['', '', '', '']);
  const [qzNewCorrectIndex, setQzNewCorrectIndex] = useState(0);

  // Playing state
  const [qzPlayIdx, setQzPlayIdx] = useState(0);
  const [qzPlayScore, setQzPlayScore] = useState(0);
  const [qzPlayAnswersSelected, setQzPlayAnswersSelected] = useState<number | null>(null);
  const [qzAnswerChecked, setQzAnswerChecked] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(`studyvibe_teaching_quiz_${currentUserId}`);
    if (cached) {
      setQuiz(JSON.parse(cached));
    } else {
      const defaults: Quiz = {
        title: 'Quantum Foundations MCQ',
        questions: [
          {
            id: 'q1',
            question: 'Which quantum state interpretation posits that measurement collapses the wavefunction?',
            options: ['Copenhagen Interpretation', 'Many-Worlds Interpretation', 'De Broglie–Bohm theory', 'Objective Collapse theory'],
            correctAnswerIndex: 0
          },
          {
            id: 'q2',
            question: 'What mathematical entity represents a quantum state in Hilbert space?',
            options: ['Complex vector (ket)', 'Real matrix', 'Complex tensor product only', 'Differential curl vector'],
            correctAnswerIndex: 0
          }
        ]
      };
      setQuiz(defaults);
      localStorage.setItem(`studyvibe_teaching_quiz_${currentUserId}`, JSON.stringify(defaults));
    }
  }, [currentUserId]);

  const saveQuiz = (nextQuiz: Quiz) => {
    setQuiz(nextQuiz);
    localStorage.setItem(`studyvibe_teaching_quiz_${currentUserId}`, JSON.stringify(nextQuiz));
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qzNewQuestion.trim() || qzNewOptions.some(o => !o.trim())) return;

    const fresh: Question = {
      id: `q_${Date.now()}`,
      question: qzNewQuestion.trim(),
      options: qzNewOptions.map(o => o.trim()),
      correctAnswerIndex: qzNewCorrectIndex
    };

    const nextQuiz = {
      ...quiz,
      questions: [...quiz.questions, fresh]
    };

    saveQuiz(nextQuiz);
    setQzNewQuestion('');
    setQzNewOptions(['', '', '', '']);
    setQzNewCorrectIndex(0);
  };

  const handleDeleteQuestion = (id: string) => {
    const nextQuiz = {
      ...quiz,
      questions: quiz.questions.filter(q => q.id !== id)
    };
    saveQuiz(nextQuiz);
  };

  const handleStartQuiz = () => {
    if (quiz.questions.length === 0) return;
    setQzPlayIdx(0);
    setQzPlayScore(0);
    setQzPlayAnswersSelected(null);
    setQzAnswerChecked(false);
    setQzMode('play');
  };

  const selectPlayOption = (idx: number) => {
    if (qzAnswerChecked) return;
    setQzPlayAnswersSelected(idx);
  };

  const checkAnswerPlay = () => {
    if (qzPlayAnswersSelected === null || qzAnswerChecked) return;
    setQzAnswerChecked(true);
    if (qzPlayAnswersSelected === quiz.questions[qzPlayIdx].correctAnswerIndex) {
      setQzPlayScore(prev => prev + 1);
    }
  };

  const nextPlayQuestion = () => {
    setQzPlayAnswersSelected(null);
    setQzAnswerChecked(false);
    if (qzPlayIdx < quiz.questions.length - 1) {
      setQzPlayIdx(prev => prev + 1);
    } else {
      setQzMode('score');
    }
  };

  /* ==========================================
     4. MIND MAP LOGIC (COSMIC NODE MAP)
     ========================================== */
  const [mindNodes, setMindNodes] = useState<MindNode[]>([]);
  const [mindLinks, setMindLinks] = useState<MindLink[]>([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeText, setEditingNodeText] = useState('');
  const [linkStartNodeId, setLinkStartNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // SVG Container tracking for rendering connections beautifully
  const svgContainerRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const cachedNodes = localStorage.getItem(`studyvibe_teaching_mnodes_${currentUserId}`);
    const cachedLinks = localStorage.getItem(`studyvibe_teaching_mlinks_${currentUserId}`);

    if (cachedNodes && cachedLinks) {
      setMindNodes(JSON.parse(cachedNodes));
      setMindLinks(JSON.parse(cachedLinks));
    } else {
      const defaultNodes: MindNode[] = [
        { id: 'mn_1', text: 'Quantum Tech', x: 250, y: 150, color: '#a78bfa' },
        { id: 'mn_2', text: 'Computing', x: 120, y: 320, color: '#818cf8' },
        { id: 'mn_3', text: 'Cryptography', x: 400, y: 320, color: '#f43f5e' }
      ];
      const defaultLinks: MindLink[] = [
        { fromId: 'mn_1', toId: 'mn_2' },
        { fromId: 'mn_1', toId: 'mn_3' }
      ];
      setMindNodes(defaultNodes);
      setMindLinks(defaultLinks);
      localStorage.setItem(`studyvibe_teaching_mnodes_${currentUserId}`, JSON.stringify(defaultNodes));
      localStorage.setItem(`studyvibe_teaching_mlinks_${currentUserId}`, JSON.stringify(defaultLinks));
    }
  }, [currentUserId]);

  const saveMindMap = (nodes: MindNode[], links: MindLink[]) => {
    setMindNodes(nodes);
    setMindLinks(links);
    localStorage.setItem(`studyvibe_teaching_mnodes_${currentUserId}`, JSON.stringify(nodes));
    localStorage.setItem(`studyvibe_teaching_mlinks_${currentUserId}`, JSON.stringify(links));
  };

  const handleAddMindNode = () => {
    const fresh: MindNode = {
      id: `mn_${Date.now()}`,
      text: 'New Core Concept',
      x: 150 + Math.random() * 150,
      y: 100 + Math.random() * 200,
      color: ['#a78bfa', '#818cf8', '#f43f5e', '#34d399', '#f59e0b'][Math.floor(Math.random() * 5)]
    };
    const nextNodes = [...mindNodes, fresh];
    saveMindMap(nextNodes, mindLinks);
    setEditingNodeId(fresh.id);
    setEditingNodeText(fresh.text);
  };

  const handleMindNodeMouseDown = (id: string) => {
    setDraggingNodeId(id);
  };

  const handleMindSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(rect.width - 20, e.clientX - rect.left));
    const y = Math.max(20, Math.min(rect.height - 20, e.clientY - rect.top));

    const nextNodes = mindNodes.map(n => n.id === draggingNodeId ? { ...n, x, y } : n);
    setMindNodes(nextNodes);
  };

  const handleMindSvgMouseUp = () => {
    if (draggingNodeId) {
      saveMindMap(mindNodes, mindLinks);
      setDraggingNodeId(null);
    }
  };

  const toggleCreateLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkStartNodeId === null) {
      setLinkStartNodeId(id);
    } else {
      if (linkStartNodeId !== id) {
        // Double connection checker
        const linkExists = mindLinks.some(
          l => (l.fromId === linkStartNodeId && l.toId === id) || (l.fromId === id && l.toId === linkStartNodeId)
        );
        if (!linkExists) {
          const nextLinks = [...mindLinks, { fromId: linkStartNodeId, toId: id }];
          saveMindMap(mindNodes, nextLinks);
        }
      }
      setLinkStartNodeId(null);
    }
  };

  const handleSaveNodeText = (id: string) => {
    const nextNodes = mindNodes.map(n => n.id === id ? { ...n, text: editingNodeText } : n);
    saveMindMap(nextNodes, mindLinks);
    setEditingNodeId(null);
  };

  const handleDeleteMindNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextNodes = mindNodes.filter(n => n.id !== id);
    const nextLinks = mindLinks.filter(l => l.fromId !== id && l.toId !== id);
    saveMindMap(nextNodes, nextLinks);
    if (linkStartNodeId === id) setLinkStartNodeId(null);
    if (editingNodeId === id) setEditingNodeId(null);
  };

  const handleResetMindMap = () => {
    saveMindMap([], []);
  };

  /* ==========================================
     5. STUDY PLANNER LOGIC
     ========================================== */
  const [planner, setPlanner] = useState<StudyPlannerSet>({});
  const weekdaysKeys = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const cached = localStorage.getItem(`studyvibe_teaching_planner_${currentUserId}`);
    if (cached) {
      setPlanner(JSON.parse(cached));
    } else {
      const defaults: StudyPlannerSet = {};
      weekdaysKeys.forEach(d => {
        defaults[d] = {
          morning: 'Quantum Physics review',
          afternoon: 'Schrödinger integrals math practice',
          evening: 'Symphilosophy writing reading draft'
        };
      });
      setPlanner(defaults);
      localStorage.setItem(`studyvibe_teaching_planner_${currentUserId}`, JSON.stringify(defaults));
    }
  }, [currentUserId]);

  const handleEditPlannerCell = (day: string, period: 'morning' | 'afternoon' | 'evening', val: string) => {
    const nextPlanner = {
      ...planner,
      [day]: {
        ...planner[day],
        [period]: val
      }
    };
    setPlanner(nextPlanner);
    localStorage.setItem(`studyvibe_teaching_planner_${currentUserId}`, JSON.stringify(nextPlanner));
  };

  /* ==========================================
     6. STUDY GOALS LOGIC OR METRICS
     ========================================== */
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Core Mechanics');

  useEffect(() => {
    const cached = localStorage.getItem(`studyvibe_teaching_goals_${currentUserId}`);
    if (cached) {
      setGoals(JSON.parse(cached));
    } else {
      const defaults: GoalItem[] = [
        { id: 'g_1', text: 'Achieve perfect score on wave packet MCQ builds', completed: true, category: 'Core Physics' },
        { id: 'g_2', text: 'Formulate mind map for relativistic formulas', completed: false, category: 'Study Prep' },
        { id: 'g_3', text: 'Conclude chapter 3 summaries by Saturday night', completed: false, category: 'Milestones' }
      ];
      setGoals(defaults);
      localStorage.setItem(`studyvibe_teaching_goals_${currentUserId}`, JSON.stringify(defaults));
    }
  }, [currentUserId]);

  const saveGoals = (nextList: GoalItem[]) => {
    setGoals(nextList);
    localStorage.setItem(`studyvibe_teaching_goals_${currentUserId}`, JSON.stringify(nextList));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const fresh: GoalItem = {
      id: `g_${Date.now()}`,
      text: newGoalText.trim(),
      completed: false,
      category: newGoalCategory
    };

    saveGoals([...goals, fresh]);
    setNewGoalText('');
  };

  const handleToggleGoal = (id: string) => {
    const nextList = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    saveGoals(nextList);
  };

  const handleDeleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const completionPercent = goals.length > 0 
    ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100)
    : 0;

  /* ==========================================
     7. STUDY FORMULA SHEET LOGIC
     ========================================== */
  const [formulas, setFormulas] = useState<FormulaItem[]>([]);
  const [formSearch, setFormSearch] = useState('');
  const [formCategoryFilter, setFormCategoryFilter] = useState('all');
  const [showFormulaCreator, setShowFormulaCreator] = useState(false);

  // New Formula fields
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormEq, setNewFormEq] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [newFormCategory, setNewFormCategory] = useState('Quantum');

  useEffect(() => {
    const cached = localStorage.getItem(`studyvibe_teaching_formulas_${currentUserId}`);
    if (cached) {
      setFormulas(JSON.parse(cached));
    } else {
      const defaults: FormulaItem[] = [
        { id: 'f_1', title: 'Schrödinger Equation (Time-Dependent)', equation: 'iℏ ∂/∂t Ψ = ĤΨ', description: 'Describes physical state of subatomic particles evolution.', category: 'Quantum Mechanics' },
        { id: 'f_2', title: 'De Broglie Wavelength Relation', equation: 'λ = h/p', description: 'Relates particle wavelength to corresponding momentum.', category: 'Wave Mechanics' },
        { id: 'f_3', title: 'Planck-Einstein Relation', equation: 'E = hν', description: 'Relates electromagnetic photon energy frequency.', category: 'Light Spectrums' },
        { id: 'f_4', title: 'Einstein Mass-Energy Equivalency', equation: 'E = mc²', description: 'Equivalence of energy and physical mass dimensions.', category: 'Relativity' }
      ];
      setFormulas(defaults);
      localStorage.setItem(`studyvibe_teaching_formulas_${currentUserId}`, JSON.stringify(defaults));
    }
  }, [currentUserId]);

  const saveFormulas = (nextList: FormulaItem[]) => {
    setFormulas(nextList);
    localStorage.setItem(`studyvibe_teaching_formulas_${currentUserId}`, JSON.stringify(nextList));
  };

  const handleAddFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim() || !newFormEq.trim()) return;

    const fresh: FormulaItem = {
      id: `f_${Date.now()}`,
      title: newFormTitle.trim(),
      equation: newFormEq.trim(),
      description: newFormDesc.trim(),
      category: newFormCategory
    };

    saveFormulas([...formulas, fresh]);
    setNewFormTitle('');
    setNewFormEq('');
    setNewFormDesc('');
    setShowFormulaCreator(false);
  };

  const handleDeleteFormula = (id: string) => {
    saveFormulas(formulas.filter(f => f.id !== id));
  };

  const filteredFormulas = formulas.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(formSearch.toLowerCase()) || 
                          f.equation.toLowerCase().includes(formSearch.toLowerCase()) || 
                          f.description.toLowerCase().includes(formSearch.toLowerCase());
    const matchesCategory = formCategoryFilter === 'all' || f.category === formCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formulaCategories = useMemo(() => {
    return Array.from(new Set(formulas.map(f => f.category)));
  }, [formulas]);

  /* ==========================================
     8. SPACED REVISION REPETITION TRACKER LOGIC
     ========================================== */
  const [revisions, setRevisions] = useState<RevisionTopic[]>([]);
  const [revNewTopic, setRevNewTopic] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem(`studyvibe_teaching_revs_${currentUserId}`);
    if (cached) {
      setRevisions(JSON.parse(cached));
    } else {
      const defaults: RevisionTopic[] = [
        { id: 'rev_1', topic: 'Heisenberg Uncertainty Limits math derivation', mastery: 85, reviewed: true, lastReviewedDate: '2026-05-20' },
        { id: 'rev_2', topic: 'Infinite square quantum well boundary constraints', mastery: 40, reviewed: false, lastReviewedDate: '2026-05-18' },
        { id: 'rev_3', topic: 'Harmonic oscillator angular frequency wavefunctions', mastery: 65, reviewed: true, lastReviewedDate: '2026-05-22' }
      ];
      setRevisions(defaults);
      localStorage.setItem(`studyvibe_teaching_revs_${currentUserId}`, JSON.stringify(defaults));
    }
  }, [currentUserId]);

  const saveRevisions = (nextList: RevisionTopic[]) => {
    setRevisions(nextList);
    localStorage.setItem(`studyvibe_teaching_revs_${currentUserId}`, JSON.stringify(nextList));
  };

  const handleAddRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revNewTopic.trim()) return;

    const fresh: RevisionTopic = {
      id: `rev_${Date.now()}`,
      topic: revNewTopic.trim(),
      mastery: 50,
      reviewed: false,
      lastReviewedDate: new Date().toISOString().split('T')[0]
    };

    saveRevisions([fresh, ...revisions]);
    setRevNewTopic('');
  };

  const handleUpdateMastery = (id: string, value: number) => {
    const nextList = revisions.map(r => r.id === id ? { ...r, mastery: value } : r);
    saveRevisions(nextList);
  };

  const handleToggleReviewed = (id: string) => {
    const nextList = revisions.map(r => r.id === id ? { 
      ...r, 
      reviewed: !r.reviewed,
      lastReviewedDate: new Date().toISOString().split('T')[0]
    } : r);
    saveRevisions(nextList);
  };

  const handleDeleteRevision = (id: string) => {
    saveRevisions(revisions.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header section with ambient particles styling */}
      <header className="flex justify-between items-center pb-6 border-b border-white/5 relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/5 blur-[80px] rounded-full pointer-events-none" />
        <div>
           <h1 className="text-4xl text-white mb-2 serif-title tracking-tight flex items-center gap-2">
             Teaching Studio
             <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-purple/15 text-brand-purple border border-brand-purple/20 font-mono text-[9px] uppercase tracking-wider gap-1">
               <GraduationCap className="w-3.5 h-3.5" /> Workspace Suite
             </span>
           </h1>
           <p className="text-gray-400 text-sm">Deploy high-fidelity interactive academic instruments to visualize, test, study and solidify complex intellectual material.</p>
        </div>
      </header>

      {/* Cinematic grid displaying beautiful, large glass cards for all 8 tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tool 1: Whiteboard Card */}
        <ToolCard 
          icon={Palette} 
          title="Creative Whiteboard" 
          desc="Express formulas, sketch subatomic particles, and export schemas instantly."
          color="from-purple-500/20 to-transparent hover:border-purple-500/30"
          onClick={() => { setActiveOverlay('whiteboard'); setTimeout(initWhiteboard, 100); }} 
        />

        {/* Tool 2: Flashcards Card */}
        <ToolCard 
          icon={Layers} 
          title="Memory Flashcards" 
          desc="Assemble smart virtual flashcards with beautiful interactive 3D rotations."
          color="from-indigo-500/20 to-transparent hover:border-indigo-500/30"
          onClick={() => setActiveOverlay('flashcards')} 
        />

        {/* Tool 3: Quiz Builder Card */}
        <ToolCard 
          icon={GraduationCap} 
          title="Quiz Testing Arena" 
          desc="Compile complex multiple-choice questions with interactive grading scoring."
          color="from-pink-500/20 to-transparent hover:border-pink-500/30"
          onClick={() => setActiveOverlay('quiz')} 
        />

        {/* Tool 4: Mind Maps Card */}
        <ToolCard 
          icon={Network} 
          title="Concept Mind Maps" 
          desc="Map connections in a cosmic coordinate constellation node grid."
          color="from-teal-500/20 to-transparent hover:border-teal-500/30"
          onClick={() => setActiveOverlay('mindmap')} 
        />

        {/* Tool 5: Study Planner Card */}
        <ToolCard 
          icon={Calendar} 
          title="Weekly Study Sync" 
          desc="Chart a serene academic layout across morning, afternoon & night sessions."
          color="from-amber-500/20 to-transparent hover:border-amber-500/30"
          onClick={() => setActiveOverlay('planner')} 
        />

        {/* Tool 6: Goals Card */}
        <ToolCard 
          icon={Target} 
          title="Milestone Goals" 
          desc="Formulate concrete study milestones tracked by a reactive performance bar."
          color="from-emerald-500/20 to-transparent hover:border-emerald-500/30"
          onClick={() => setActiveOverlay('goals')} 
        />

        {/* Tool 7: Formula Sheets Card */}
        <ToolCard 
          icon={Binary} 
          title="Formula CheatSheets" 
          desc="Query monospaced symbolic formulas curated across distinct scientific domains."
          color="from-cyan-500/20 to-transparent hover:border-cyan-500/30"
          onClick={() => setActiveOverlay('formulas')} 
        />

        {/* Tool 8: Revision Tracker Card */}
        <ToolCard 
          icon={Compass} 
          title="Spaced Repetition" 
          desc="Rate and monitor review levels to conquer curves of memory decay."
          color="from-rose-500/20 to-transparent hover:border-rose-500/30"
          onClick={() => setActiveOverlay('revision')} 
        />

        {/* Tool 9: Adobe PDF Scholar */}
        <ToolCard 
          icon={BookOpen} 
          title="Adobe PDF Scholar" 
          desc="Integrate interactive Adobe PDF research textbook reading side-by-side with active study notes."
          color="from-amber-600/20 to-transparent hover:border-amber-500/30"
          onClick={() => setActiveOverlay('pdf_viewer')} 
        />

      </div>

      {/* ==========================================
         CINEMATIC FULLSCREEN MODAL OVERLAYS
         ========================================== */}
      <AnimatePresence>
        {activeOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/92 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.98, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="glass-panel w-full max-w-5xl h-[88vh] flex flex-col justify-between border border-white/10 bg-[#060609]/95 text-white shadow-[0_0_80px_rgba(139,92,246,0.2)] rounded-3xl overflow-hidden relative"
            >
              
              {/* Overlay general top header control bar */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
                     <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="serif-title text-base text-white tracking-wide uppercase">
                      {activeOverlay === 'whiteboard' && 'Creative Slate Whiteboard'}
                      {activeOverlay === 'flashcards' && 'Arcane Memory Flashcards'}
                      {activeOverlay === 'quiz' && 'Scholastic Testing Center'}
                      {activeOverlay === 'mindmap' && 'Constellation Concept Map'}
                      {activeOverlay === 'planner' && 'Serene Academic Session Planner'}
                      {activeOverlay === 'goals' && 'Study Matrix Goals Tracker'}
                      {activeOverlay === 'formulas' && 'Formula Symbology CheatSheet'}
                      {activeOverlay === 'revision' && 'Memory decay repetition engine'}
                      {activeOverlay === 'pdf_viewer' && 'Adobe PDF Study Scholar'}
                    </h3>
                    <p className="text-[10px] font-mono text-gray-500 tracking-wider">TEACHING STUDIO UTILITY</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setActiveOverlay(null)}
                     className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 font-mono text-[10px] uppercase tracking-wider transition-all"
                   >
                     CLOSE DRAWER ✕
                   </button>
                </div>
              </div>

              {/* Overlay dynamic view selectors */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">

                {/* DYNAMIC SCENE 1: WHITEBOARD DRAWING CANVAS */}
                {activeOverlay === 'whiteboard' && (
                  <div className="space-y-6 flex flex-col items-center h-full">
                    {/* Toolbar options for whiteboard draws */}
                    <div className="w-full flex flex-wrap gap-4 items-center justify-between p-3 border border-white/5 bg-white/[0.02] rounded-2xl">
                      
                      <div className="flex items-center gap-2">
                        {/* Selector values */}
                        <button
                          onClick={() => setWbTool('pencil')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all ${
                            wbTool === 'pencil' 
                              ? 'bg-brand-purple/20 border-brand-purple text-white shadow-md' 
                              : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          Pencil Ink
                        </button>
                        <button
                          onClick={() => setWbTool('eraser')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all ${
                            wbTool === 'eraser' 
                              ? 'bg-brand-purple/20 border-brand-purple text-white shadow-md' 
                              : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          Erase Path
                        </button>
                      </div>

                      <div className="w-[1px] h-6 bg-white/10" />

                      {/* Visual Color Picker Swatches */}
                      <div className="flex items-center gap-1.5">
                        {['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ffffff'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setWbColor(c)}
                            className={`w-5 h-5 rounded-full border transition-all ${
                              wbColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <div className="w-[1px] h-6 bg-white/10" />

                      {/* Size Selector and utilities */}
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-mono text-gray-500 uppercase">Brush Thickness:</span>
                         <input 
                           type="range" 
                           min={1} 
                           max={25} 
                           value={wbBrushSize}
                           onChange={(e) => setWbBrushSize(Number(e.target.value))}
                           className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                         />
                         <span className="text-xs font-mono text-gray-300">{wbBrushSize}px</span>
                      </div>

                      <div className="w-[1px] h-6 bg-white/10" />

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleWbUndo} 
                          disabled={wbHistoryIdx <= 0}
                          className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/15 text-gray-300 disabled:opacity-25 transition-colors"
                          title="Undo Sketch"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleWbRedo} 
                          disabled={wbHistoryIdx >= wbHistory.length - 1}
                          className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/15 text-gray-300 disabled:opacity-25 transition-colors"
                          title="Redo Sketch"
                        >
                          <Undo2 className="w-4 h-4 scale-x-[-1]" />
                        </button>
                        <GlowButton onClick={exportWbAsPng} size="sm">
                          Export Capture PNG
                        </GlowButton>
                        <button
                          onClick={clearWhiteboard}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 text-xs font-mono tracking-widest uppercase transition-colors"
                        >
                          Clear Sandbox
                        </button>
                      </div>

                    </div>

                    {/* Infinite physical Drawing Canvas board */}
                    <div className="w-full flex-1 border border-white/15 bg-[#0a0a10] rounded-2xl relative overflow-hidden flex items-center justify-center">
                       <canvas
                         ref={canvasRef}
                         onMouseDown={(e) => {
                           const p = getCanvasMousePos(e);
                           startWhiteboardDrawing(p.x, p.y);
                         }}
                         onMouseMove={(e) => {
                           const p = getCanvasMousePos(e);
                           drawWhiteboard(p.x, p.y);
                         }}
                         onMouseUp={stopWhiteboardDrawing}
                         onMouseLeave={stopWhiteboardDrawing}
                         
                         onTouchStart={(e) => {
                           const p = getCanvasTouchPos(e);
                           startWhiteboardDrawing(p.x, p.y);
                         }}
                         onTouchMove={(e) => {
                           const p = getCanvasTouchPos(e);
                           drawWhiteboard(p.x, p.y);
                         }}
                         onTouchEnd={stopWhiteboardDrawing}

                         className="cursor-crosshair block rounded-2xl"
                       />
                    </div>
                  </div>
                )}


                {/* DYNAMIC SCENE 2: INTERACTIVE MEMORY FLASHCARDS */}
                {activeOverlay === 'flashcards' && (
                  <div className="space-y-6 flex flex-col md:flex-row gap-8 h-full">
                    
                    {/* Left flashcards list configuration */}
                    <div className="w-full md:w-80 border-r border-white/5 pr-6 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                           <span className="text-xs uppercase font-mono tracking-wider text-gray-500">Aura Decks</span>
                           <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded">{flashcards.length} Cards</span>
                        </div>

                        {/* List items block */}
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {flashcards.map((fc, idx) => (
                            <div 
                              key={fc.id}
                              onClick={() => { setFcIndex(idx); setFcFlipped(false); }}
                              className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                                fcIndex === idx 
                                  ? 'bg-brand-purple/20 border-brand-purple/35 text-white' 
                                  : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="text-xs font-serif truncate max-w-[170px]">{fc.front}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFlashcard(fc.id); }}
                                className="text-gray-500 hover:text-rose-400 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fresh Flashcard submission form */}
                      <div className="border-t border-white/5 pt-4 space-y-3">
                         {showFcCreator ? (
                           <form onSubmit={handleCreateFlashcard} className="space-y-3">
                             <div>
                               <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Concept Front Query</label>
                               <input 
                                 type="text"
                                 required
                                 value={fcNewFront}
                                 onChange={(e) => setFcNewFront(e.target.value)}
                                 placeholder="e.g. State of De Broglie frequency"
                                 className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                               />
                             </div>
                             <div>
                               <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Intel Back Synthesis</label>
                               <textarea 
                                 rows={2}
                                 required
                                 value={fcNewBack}
                                 onChange={(e) => setFcNewBack(e.target.value)}
                                 placeholder="e.g. Relates energy to wave patterns..."
                                 className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none"
                               />
                             </div>
                             <div className="flex gap-2">
                               <button 
                                 type="submit"
                                 className="flex-1 py-1.5 rounded-lg bg-brand-purple/20 border border-brand-purple/30 text-[10px] font-mono uppercase font-bold text-white hover:bg-brand-purple transition-all"
                               >
                                 Create Core Flashcard
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => setShowFcCreator(false)}
                                 className="px-2 py-1.5 rounded-lg border border-white/5 text-[10px] font-mono text-gray-400 hover:text-white"
                               >
                                 Cancel
                               </button>
                             </div>
                           </form>
                         ) : (
                           <button
                             onClick={() => setShowFcCreator(true)}
                             className="w-full py-2 border border-dashed border-white/10 hover:border-white/25 rounded-2xl text-xs font-mono uppercase tracking-widest text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
                           >
                             <Plus className="w-4 h-4 text-brand-purple" /> Add Memory Card
                           </button>
                         )}
                      </div>

                    </div>

                    {/* Right center active flashcard 3D scene previewer */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {flashcards.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                           <Layers className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                           <p className="font-serif italic text-gray-450">No flashcards drafted. Deploy some via form.</p>
                        </div>
                      ) : (
                        <div className="space-y-6 w-full max-w-lg">
                           {/* 3D Rotational card slot */}
                           <div 
                             onClick={() => setFcFlipped(!fcFlipped)}
                             className="perspective-1000 w-full h-80 cursor-pointer"
                           >
                              <div className={`relative w-full h-full duration-550 transform-style-3d ${fcFlipped ? 'rotate-y-180' : ''}`}>
                                 
                                 {/* Front Surface */}
                                 <div className="absolute inset-0 backface-hidden flex flex-col justify-between items-center p-8 bg-neutral-950 border border-white/10 rounded-3xl shadow-xl">
                                    <div className="w-full flex justify-between items-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                                       <span>SCHOLAR REVISION DECK</span>
                                       <span>FRONT INQUIRY</span>
                                    </div>
                                    <h4 className="font-serif text-2xl text-neutral-100 text-center leading-relaxed">
                                       {flashcards[fcIndex].front}
                                    </h4>
                                    <span className="text-[10px] font-mono text-brand-purple animate-pulse">TAP FRAME TO REVEAL DEEP SYNTHESIS ❯</span>
                                 </div>

                                 {/* Back Surface */}
                                 <div className="absolute inset-x-0 inset-y-0 rotate-y-180 backface-hidden flex flex-col justify-between items-center p-8 bg-[#09090f] border border-brand-purple/35 rounded-3xl shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                                    <div className="w-full flex justify-between items-center text-[9px] font-mono text-brand-purple uppercase tracking-widest">
                                       <span>SYNTHESIS INDEX</span>
                                       <span>BACK DECRYPTED</span>
                                    </div>
                                    <p className="font-sans text-base text-gray-200 text-center leading-relaxed max-w-sm">
                                       {flashcards[fcIndex].back}
                                    </p>
                                    <span className="text-[10px] font-mono text-gray-500">TAP FRAME TO FLIP AGAIN ❮</span>
                                 </div>

                              </div>
                           </div>

                           {/* Navigation slide layout */}
                           <div className="flex items-center justify-between p-2 bg-white/5 rounded-2xl border border-white/5">
                              <button
                                onClick={() => { setFcIndex(prev => Math.max(0, prev - 1)); setFcFlipped(false); }}
                                disabled={fcIndex === 0}
                                className="p-2 rounded-xl border border-white/5 disabled:opacity-20 text-gray-400 hover:text-white hover:bg-white/5"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              
                              <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                                CARD {fcIndex + 1} OF {flashcards.length}
                              </span>

                              <button
                                onClick={() => { setFcIndex(prev => Math.min(flashcards.length - 1, prev + 1)); setFcFlipped(false); }}
                                disabled={fcIndex === flashcards.length - 1}
                                className="p-2 rounded-xl border border-white/5 disabled:opacity-20 text-gray-400 hover:text-white"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}


                {/* DYNAMIC SCENE 3: GAMIFIED QUIZ BUILDER */}
                {activeOverlay === 'quiz' && (
                  <div className="space-y-6 flex flex-col md:flex-row gap-8 h-full">
                    
                    {/* Left Creator column */}
                    <div className="w-full md:w-80 border-r border-white/5 pr-6 space-y-4">
                       <span className="text-xs uppercase font-mono tracking-wider text-gray-500 block border-b border-white/5 pb-2">CREATE QUESTIONS</span>
                       
                       <form onSubmit={handleAddQuestion} className="space-y-4">
                         <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Question Description</label>
                            <textarea
                              rows={2}
                              required
                              value={qzNewQuestion}
                              onChange={(e) => setQzNewQuestion(e.target.value)}
                              placeholder="e.g. What denotes angular wavelength?"
                              className="w-full bg-[#050508] border border-white/10 rounded-xl p-2.5 text-xs text-white resize-none"
                            />
                         </div>

                         <div className="space-y-2">
                            <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Answers Multi Choice (MCQ)</label>
                            {qzNewOptions.map((opt, oIdx) => (
                              <div key={oIdx} className="flex gap-2 items-center">
                                <input 
                                  type="radio"
                                  name="correctAnswerSelect"
                                  checked={qzNewCorrectIndex === oIdx}
                                  onChange={() => setQzNewCorrectIndex(oIdx)}
                                  className="accent-brand-purple cursor-pointer"
                                />
                                <input 
                                  type="text"
                                  required
                                  value={opt}
                                  onChange={(e) => {
                                    const copy = [...qzNewOptions];
                                    copy[oIdx] = e.target.value;
                                    setQzNewOptions(copy);
                                  }}
                                  placeholder={`Option ${oIdx + 1}...`}
                                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                                />
                              </div>
                            ))}
                            <p className="text-[9px] font-mono text-gray-500 italic mt-1">Select the radio bullet to denote the correct key answer.</p>
                         </div>

                         <GlowButton type="submit" className="w-full text-xs font-mono uppercase tracking-widest py-2 rounded-xl">
                           COMPILE MCQ NODE
                         </GlowButton>
                       </form>
                    </div>

                    {/* Right active Quiz Play zone scene */}
                    <div className="flex-1 flex flex-col min-h-0 justify-between">
                       
                       {qzMode === 'create' && (
                         <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                               <h4 className="font-serif italic text-lg text-white">Interactive Syllabus Checklist</h4>
                               {quiz.questions.length > 0 && (
                                 <GlowButton onClick={handleStartQuiz} size="sm">
                                   Launch Active Quiz Arena 🎥
                                 </GlowButton>
                               )}
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                               {quiz.questions.length === 0 ? (
                                 <div className="text-center py-12 space-y-2">
                                   <HelpCircle className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                                   <p className="font-serif italic text-gray-400">No MCQ items prepared yet. Draft questions on the left compiler.</p>
                                 </div>
                               ) : (
                                 quiz.questions.map((q, qIdx) => (
                                   <div key={q.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-start">
                                      <div className="space-y-2">
                                         <p className="font-sans text-xs font-bold text-gray-300">
                                            {qIdx + 1}. {q.question}
                                         </p>
                                         <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-500">
                                            {q.options.map((opt, oIdx) => (
                                              <span key={oIdx} className={oIdx === q.correctAnswerIndex ? 'text-brand-purple font-bold' : ''}>
                                                 {oIdx + 1}) {opt} {oIdx === q.correctAnswerIndex ? '✓' : ''}
                                              </span>
                                            ))}
                                         </div>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="text-gray-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                   </div>
                                 ))
                               )}
                            </div>
                         </div>
                       )}

                       {/* Quiz active play mode slider */}
                       {qzMode === 'play' && quiz.questions.length > 0 && (
                         <div className="space-y-6 max-w-xl mx-auto w-full py-8">
                            <div className="space-y-2">
                               <span className="text-[10px] font-mono text-brand-purple tracking-widest uppercase">QUESTION {qzPlayIdx + 1} OF {quiz.questions.length}</span>
                               <h3 className="font-serif text-xl leading-relaxed text-white">
                                  {quiz.questions[qzPlayIdx].question}
                               </h3>
                            </div>

                            <div className="space-y-2.5">
                               {quiz.questions[qzPlayIdx].options.map((opt, oIdx) => {
                                 let borderClass = 'border-white/5 hover:bg-white/5';
                                 if (qzPlayAnswersSelected === oIdx) {
                                   borderClass = 'bg-brand-purple/10 border-brand-purple/50 text-brand-purple';
                                 }
                                 if (qzAnswerChecked) {
                                   if (oIdx === quiz.questions[qzPlayIdx].correctAnswerIndex) {
                                     borderClass = 'bg-emerald-500/15 border-emerald-555 text-emerald-400 font-bold';
                                   } else if (qzPlayAnswersSelected === oIdx) {
                                     borderClass = 'bg-rose-500/15 border-rose-500/35 text-rose-450';
                                   }
                                 }

                                 return (
                                   <div 
                                     key={oIdx}
                                     onClick={() => selectPlayOption(oIdx)}
                                     className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${borderClass}`}
                                   >
                                      <span>{opt}</span>
                                      {qzAnswerChecked && oIdx === quiz.questions[qzPlayIdx].correctAnswerIndex && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                      )}
                                   </div>
                                 );
                               })}
                            </div>

                            <div className="flex gap-4 pt-4">
                               {!qzAnswerChecked ? (
                                 <button 
                                   onClick={checkAnswerPlay}
                                   disabled={qzPlayAnswersSelected === null}
                                   className="flex-1 py-2.5 bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-25 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
                                 >
                                    Verify Selection
                                 </button>
                               ) : (
                                 <GlowButton onClick={nextPlayQuestion} className="flex-1 text-xs py-2.5 rounded-xl">
                                    Next Intelligence Node ❯
                                 </GlowButton>
                               )}
                            </div>
                         </div>
                       )}

                       {/* Quiz Scorings card display */}
                       {qzMode === 'score' && (
                         <div className="text-center py-12 max-w-md mx-auto space-y-6">
                            <div className="relative inline-block">
                               <div className="absolute inset-0 bg-brand-purple/15 blur-xl rounded-full" />
                               <Trophy className="w-16 h-16 text-yellow-500 mx-auto relative z-10 animate-bounce" />
                            </div>

                            <div className="space-y-1">
                               <h3 className="font-serif text-2xl text-white">Syllabus Evaluation Complete</h3>
                               <p className="font-mono text-[10px] text-gray-500 tracking-wider">ACADEMY PROFILE RECORDED</p>
                            </div>

                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-2">
                               <span className="text-xs font-mono text-gray-400 uppercase">Correct Response Score Metric</span>
                               <div className="text-4xl font-mono font-bold text-brand-purple">
                                  {qzPlayScore} / {quiz.questions.length}
                               </div>
                               <p className="text-[10px] font-mono text-gray-500">
                                  Accuracy Percentage: {Math.round((qzPlayScore / quiz.questions.length) * 100)}%
                               </p>
                            </div>

                            <div className="flex gap-3">
                               <button 
                                 onClick={handleStartQuiz}
                                 className="flex-1 py-2 rounded-xl bg-brand-purple/15 hover:bg-brand-purple border border-brand-purple/20 font-mono text-xs text-white transition-all"
                               >
                                 Retake Testing
                               </button>
                               <button 
                                 onClick={() => setQzMode('create')}
                                 className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-mono text-xs text-gray-300 hover:text-white transition-all"
                               >
                                 Back to Compilers
                               </button>
                            </div>
                         </div>
                       )}

                    </div>

                  </div>
                )}


                {/* DYNAMIC SCENE 4: COSMIC NODE MIND MAP */}
                {activeOverlay === 'mindmap' && (
                  <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Toolbar controls mapped dynamically */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-3 border border-white/5 bg-white/[0.02] rounded-2xl">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono text-gray-500 uppercase">Constellations Control:</span>
                         <button
                           onClick={handleAddMindNode}
                           className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-1.5"
                         >
                           <Plus className="w-4 h-4" /> Fresh Cluster
                         </button>
                         <button
                           onClick={handleResetMindMap}
                           className="px-3 py-1.5 border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/15 text-rose-450 rounded-xl text-xs font-mono uppercase tracking-widest transition-all"
                         >
                           Wipe Galaxy
                         </button>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 uppercase">
                         <div className="flex items-center gap-1.5">
                            <Move className="w-3.5 h-3.5 text-brand-purple" />
                            <span>Drag Clusters</span>
                         </div>
                         <div className="w-1 h-1 rounded-full bg-white/10" />
                         <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-brand-indigo" />
                            <span>Click links icon to link nodes</span>
                         </div>
                      </div>
                    </div>

                    {/* SVG Constellation Canvas Drawing mapping layout drag fields */}
                    <div className="w-full flex-1 border border-white/10 bg-[#07070a]/92 rounded-3xl relative overflow-hidden select-none">
                       
                       <svg 
                         ref={svgContainerRef}
                         className="absolute inset-0 w-full h-full pointer-events-none"
                         onMouseMove={handleMindSvgMouseMove}
                         onMouseUp={handleMindSvgMouseUp}
                         onMouseLeave={handleMindSvgMouseUp}
                       >
                         {/* Draw connect linking vectors lines */}
                         {mindLinks.map((link, idx) => {
                           const fromNode = mindNodes.find(n => n.id === link.fromId);
                           const toNode = mindNodes.find(n => n.id === link.toId);
                           if (!fromNode || !toNode) return null;

                           return (
                             <line
                               key={`lnk_${idx}`}
                               x1={fromNode.x}
                               y1={fromNode.y}
                               x2={toNode.x}
                               y2={toNode.y}
                               stroke={fromNode.color}
                               strokeWidth={1.5}
                               strokeOpacity={0.4}
                               strokeDasharray="4 4"
                             />
                           );
                         })}
                       </svg>

                       {/* Constellation Drag Node elements */}
                       {mindNodes.map((node) => {
                         const isLinkingMode = linkStartNodeId !== null;
                         const isStartNodeOfLink = linkStartNodeId === node.id;

                         return (
                           <div
                             key={node.id}
                             style={{
                               position: 'absolute',
                               left: node.x,
                               top: node.y,
                               transform: 'translate(-50%, -50%)',
                               zIndex: 20
                             }}
                             className={`group p-4 bg-neutral-950/90 border rounded-2xl cursor-grab active:cursor-grabbing transition-all ${
                               isStartNodeOfLink 
                                 ? 'border-brand-purple ring-2 ring-brand-purple shadow-xl animate-pulse' 
                                 : 'border-white/10 hover:border-white/20'
                             }`}
                             onMouseDown={() => handleMindNodeMouseDown(node.id)}
                           >
                              {/* Quick items editing mode panel */}
                              {editingNodeId === node.id ? (
                                <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                                   <input
                                     type="text"
                                     value={editingNodeText}
                                     onChange={(e) => setEditingNodeText(e.target.value)}
                                     onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNodeText(node.id); }}
                                     className="bg-[#050508] border border-white/15 rounded px-2 py-1 text-xs text-white font-sans focus:outline-none focus:border-brand-purple"
                                     autoFocus
                                   />
                                   <button 
                                     onClick={() => handleSaveNodeText(node.id)}
                                     className="p-1 bg-brand-purple rounded text-white text-[10px]"
                                   >
                                     ✓
                                   </button>
                                </div>
                              ) : (
                                <div className="space-y-1 text-center">
                                   <div className="flex items-center gap-1.5 justify-center">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
                                      <p className="text-xs font-serif text-white whitespace-nowrap">{node.text}</p>
                                   </div>

                                   {/* Hidden tools toggled on card hover */}
                                   <div className="pt-2 opacity-0 group-hover:opacity-100 flex gap-2 items-center justify-center transition-all">
                                      <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); setEditingNodeText(node.text); }}
                                        className="p-1 rounded bg-white/5 border border-white/5 hover:text-brand-purple text-gray-400 text-[10px]"
                                        title="Rename node"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => toggleCreateLink(node.id, e)}
                                        className={`p-1 rounded text-[9px] uppercase font-mono tracking-widest ${
                                          isLinkingMode 
                                            ? 'bg-brand-purple text-white shadow-xl' 
                                            : 'bg-white/5 border border-white/5 text-gray-400 hover:text-brand-indigo'
                                        }`}
                                        title="Link nodes together"
                                      >
                                        Link
                                      </button>
                                      <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => handleDeleteMindNode(node.id, e)}
                                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/15 text-rose-450"
                                        title="Sever cluster node"
                                      >
                                        ✕
                                      </button>
                                   </div>
                                </div>
                              )}
                           </div>
                         );
                       })}

                       {mindNodes.length === 0 && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer" onClick={handleAddMindNode}>
                            <HelpCircle className="w-12 h-12 text-gray-600 animate-pulse" />
                            <p className="font-serif italic text-gray-400 text-sm">Nothing currently modeled. Click "Fresh Cluster" in tools toolbar.</p>
                         </div>
                       )}

                    </div>

                  </div>
                )}


                {/* DYNAMIC SCENE 5: STUDY PLANNER CALENDAR */}
                {activeOverlay === 'planner' && (
                  <div className="space-y-6 flex flex-col h-full">
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                       <h4 className="font-serif italic text-lg text-white">Chronicle Weekly Syllabus Agenda</h4>
                       <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">CALM SPACE GRID</span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                       <table className="w-full text-left border-collapse border border-white/5">
                          <thead>
                             <tr className="bg-white/[0.02]">
                                <th className="p-4 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-gray-500 w-32">Day Dimension</th>
                                <th className="p-4 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-brand-purple">Morning Slot</th>
                                <th className="p-4 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-brand-indigo">Afternoon Slot</th>
                                <th className="p-4 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-pink-400">Night Session</th>
                             </tr>
                          </thead>
                          <tbody>
                             {weekdaysKeys.map((day) => {
                               const sched = planner[day] || { morning: '', afternoon: '', evening: '' };
                               return (
                                 <tr key={day} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="p-4 border border-white/5 font-serif italic text-sm text-neutral-300 h-20">{day}</td>
                                    
                                    {/* Morning Period */}
                                    <td className="p-2 border border-white/5 relative group">
                                       <textarea
                                         value={sched.morning}
                                         onChange={(e) => handleEditPlannerCell(day, 'morning', e.target.value)}
                                         placeholder="Input core goal objectives..."
                                         className="w-full h-16 bg-transparent resize-none border-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none font-sans"
                                       />
                                    </td>

                                    {/* Afternoon Period */}
                                    <td className="p-2 border border-white/5 relative group">
                                       <textarea
                                         value={sched.afternoon}
                                         onChange={(e) => handleEditPlannerCell(day, 'afternoon', e.target.value)}
                                         placeholder="Input revision activities..."
                                         className="w-full h-16 bg-transparent resize-none border-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none font-sans"
                                       />
                                    </td>

                                    {/* Night Period */}
                                    <td className="p-2 border border-white/5 relative group">
                                       <textarea
                                         value={sched.evening}
                                         onChange={(e) => handleEditPlannerCell(day, 'evening', e.target.value)}
                                         placeholder="Input readings notes..."
                                         className="w-full h-16 bg-transparent resize-none border-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none font-sans"
                                       />
                                    </td>

                                 </tr>
                               );
                             })}
                          </tbody>
                       </table>
                    </div>

                  </div>
                )}


                {/* DYNAMIC SCENE 6: STUDY MILESTONES GOALS */}
                {activeOverlay === 'goals' && (
                  <div className="space-y-6 flex flex-col md:flex-row gap-8 h-full">
                     
                     {/* Left setup goal tracker list */}
                     <div className="w-full md:w-80 border-r border-white/5 pr-6 space-y-4">
                        <span className="text-xs uppercase font-mono tracking-wider text-gray-500 block border-b border-white/5 pb-2">COMPILE MILESTONES</span>

                        <form onSubmit={handleAddGoal} className="space-y-4">
                           <div>
                              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Milestone Description</label>
                              <input 
                                type="text"
                                required
                                value={newGoalText}
                                onChange={(e) => setNewGoalText(e.target.value)}
                                placeholder="e.g. Relativistic equation derivation exam"
                                className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                              />
                           </div>

                           <div>
                              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Category Domain</label>
                              <select 
                                value={newGoalCategory}
                                onChange={(e) => setNewGoalCategory(e.target.value)}
                                className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-brand-purple"
                              >
                                 <option value="Core Physics">Core Physics</option>
                                 <option value="Mathematical Integrals">Mathematical Integrals</option>
                                 <option value="Reading Syllabus">Reading Syllabus</option>
                                 <option value="Research Drafts">Research Drafts</option>
                              </select>
                           </div>

                           <GlowButton type="submit" className="w-full text-xs font-mono uppercase tracking-widest py-2 rounded-xl">
                              DEPLOY GOAL NODE
                           </GlowButton>
                        </form>
                     </div>

                     {/* Right interactive goals checklist items list with progress calculations */}
                     <div className="flex-1 flex flex-col min-h-0 justify-between space-y-6">
                        
                        {/* Upper Stats Metrics cards */}
                        <div className="p-5 border border-white/10 bg-white/[0.01] rounded-3xl space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Syllabus Completion Bar</span>
                              <span className="text-sm font-mono font-bold text-brand-purple">{completionPercent}% COMPLETE</span>
                           </div>

                           {/* Progress indicators */}
                           <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercent}%` }}
                                className="h-full bg-gradient-to-r from-brand-purple to-brand-indigo shadow-[0_0_12px_rgba(139,92,246,0.5)] rounded-full"
                              />
                           </div>

                           <div className="flex gap-4 text-[10px] font-mono text-gray-500">
                              <span>Total Compiled: {goals.length} Nodes</span>
                              <span>•</span>
                              <span>Completed: {goals.filter(g => g.completed).length} Nodes</span>
                           </div>
                        </div>

                        {/* Interactive list view */}
                        <div className="flex-1 overflow-y-auto pr-1 max-h-[300px]">
                           <div className="space-y-2.5">
                              {goals.map((g) => (
                                <div 
                                  key={g.id}
                                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                    g.completed 
                                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-white/[0.01] border-white/5 text-gray-300'
                                  }`}
                                >
                                   <div className="flex items-center gap-3">
                                      {/* Done toggle checkbox */}
                                      <button 
                                        onClick={() => handleToggleGoal(g.id)}
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                          g.completed 
                                            ? 'bg-emerald-500 border-emerald-500 text-black' 
                                            : 'border-white/20 hover:border-brand-purple'
                                        }`}
                                      >
                                         {g.completed && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                      
                                      <div className="space-y-0.5">
                                         <p className={`text-xs ${g.completed ? 'line-through text-gray-550' : 'text-neutral-200'}`}>{g.text}</p>
                                         <span className="inline-block text-[9px] font-mono uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-500">
                                            {g.category}
                                         </span>
                                      </div>
                                   </div>

                                   <button 
                                     onClick={() => handleDeleteGoal(g.id)}
                                     className="text-gray-550 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                                   >
                                      <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                </div>
                              ))}

                              {goals.length === 0 && (
                                <div className="text-center py-12 space-y-2">
                                   <Target className="w-12 h-12 text-gray-650 mx-auto animate-pulse" />
                                   <p className="font-serif italic text-gray-450 text-sm">Empty milestones. Initialize targets today.</p>
                                </div>
                              )}
                           </div>
                        </div>

                     </div>

                  </div>
                )}


                {/* DYNAMIC SCENE 7: SEARCHABLE FORMULA INDEX */}
                {activeOverlay === 'formulas' && (
                  <div className="space-y-6 flex flex-col h-full">
                     
                     {/* Search tools panel */}
                     <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                        
                        <div className="flex gap-2 flex-1 max-w-sm">
                           <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input 
                                type="text"
                                value={formSearch}
                                onChange={(e) => setFormSearch(e.target.value)}
                                placeholder="Search active formulas database..."
                                className="w-full bg-[#050508] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                              />
                           </div>
                        </div>

                        {/* Category list filters */}
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-mono text-gray-500 uppercase">Categories:</span>
                           <button
                             onClick={() => setFormCategoryFilter('all')}
                             className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all border ${
                               formCategoryFilter === 'all' 
                                 ? 'bg-neutral-800 border-white/10 text-white' 
                                 : 'border-transparent text-gray-400 hover:text-white'
                             }`}
                           >
                             All Modes
                           </button>
                           {formulaCategories.map((cat) => (
                             <button
                               key={cat}
                               onClick={() => setFormCategoryFilter(cat)}
                               className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all border ${
                                 formCategoryFilter === cat 
                                   ? 'bg-neutral-800 border-white/10 text-white' 
                                   : 'border-transparent text-gray-400 hover:text-white'
                               }`}
                             >
                               {cat}
                             </button>
                           ))}
                           
                           <div className="w-[1px] h-6 bg-white/10 mx-2" />

                           <button 
                             onClick={() => setShowFormulaCreator(!showFormulaCreator)}
                             className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/80 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center gap-1.5"
                           >
                              <Plus className="w-3.5 h-3.5" /> COMPILE EQUATION
                           </button>
                        </div>

                     </div>

                     {showFormulaCreator && (
                       <form onSubmit={handleAddFormulaSubmit} className="p-4 border border-brand-purple/20 bg-brand-purple/5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4">
                          <div>
                             <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Equation Title</label>
                             <input 
                               type="text"
                               required
                               value={newFormTitle}
                               onChange={(e) => setNewFormTitle(e.target.value)}
                               placeholder="e.g. Wave packet frequency"
                               className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Monospaced Formula Notation</label>
                             <input 
                               type="text"
                               required
                               value={newFormEq}
                               onChange={(e) => setNewFormEq(e.target.value)}
                               placeholder="e.g. k = 2π / λ"
                               className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Syllabus category Name</label>
                             <input 
                               type="text"
                               required
                               value={newFormCategory}
                               onChange={(e) => setNewFormCategory(e.target.value)}
                               placeholder="e.g. Wave Mechanics"
                               className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                             />
                          </div>
                          <div className="md:col-span-4 flex items-end gap-3 justify-between">
                             <div className="flex-1">
                                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Notes description</label>
                                <input 
                                  type="text"
                                  value={newFormDesc}
                                  onChange={(e) => setNewFormDesc(e.target.value)}
                                  placeholder="Provides relational spectrum parameters..."
                                  className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                             </div>
                             <button type="submit" className="py-2 px-4 rounded-xl bg-brand-purple border border-brand-purple/30 text-xs font-mono uppercase font-bold text-white whitespace-nowrap">
                               CONFIRM COMPILATION
                             </button>
                          </div>
                       </form>
                     )}

                     {/* Formulas Responsive Cards List */}
                     <div className="flex-1 overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {filteredFormulas.map((f) => (
                             <GlassCard key={f.id} className="p-6 space-y-4 border-white/5 bg-white/[0.02]">
                                <div className="flex justify-between items-start">
                                   <div className="space-y-1">
                                      <h4 className="font-serif italic text-base text-white">{f.title}</h4>
                                      <span className="inline-block text-[9px] font-mono uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-500">
                                         {f.category}
                                      </span>
                                   </div>
                                   <button 
                                     onClick={() => handleDeleteFormula(f.id)}
                                     className="text-gray-550 hover:text-rose-450 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                                   >
                                      <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                </div>

                                {/* Monospaced formula display */}
                                <div className="p-4 bg-black/60 border border-white/5 rounded-2xl text-center shadow-inner relative groupoverflow-hidden">
                                   <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/5 blur-xl rounded-full" />
                                   <span className="font-mono text-xl font-bold text-brand-indigo tracking-wider relative z-10 select-all">
                                      {f.equation}
                                   </span>
                                </div>

                                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                                   {f.description}
                                </p>
                             </GlassCard>
                           ))}
                        </div>

                        {filteredFormulas.length === 0 && (
                          <div className="text-center py-12 space-y-2">
                             <Binary className="w-12 h-12 text-gray-650 mx-auto animate-pulse" />
                             <p className="font-serif italic text-gray-450 text-sm">No formulas matched filter settings.</p>
                          </div>
                        )}
                     </div>

                  </div>
                )}


                {/* DYNAMIC SCENE 9: ADOBE PDF STUDY SCHOLAR */}
                {activeOverlay === 'pdf_viewer' && (
                  <div className="flex flex-col md:flex-row gap-6 h-full min-h-0 relative">
                     {/* PDF Viewer Pane */}
                     <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {/* URL Paste & Local Upload controls bar */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl shadow-xl">
                           <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:w-auto">
                              <button
                                 onClick={() => pdfInputRef.current?.click()}
                                 className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-[11px] font-mono uppercase tracking-widest flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                              >
                                 <Upload className="w-3.5 h-3.5" /> Upload local PDF
                              </button>
                              <input 
                                 type="file" 
                                 ref={pdfInputRef}
                                 onChange={handlePdfUpload}
                                 accept="application/pdf"
                                 className="hidden" 
                              />

                              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline font-bold">OR</span>

                              <div className="relative flex-1 sm:w-72 w-full">
                                 <input 
                                    type="text"
                                    placeholder="Enter Web PDF URL..."
                                    value={tempPdfUrl}
                                    onChange={(e) => setTempPdfUrl(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-stone-200 italic focus:outline-none focus:border-purple-500/50 font-mono"
                                 />
                              </div>

                              <button
                                 onClick={() => {
                                    if (tempPdfUrl.trim()) {
                                       setPdfUrl(tempPdfUrl.trim());
                                       setTempPdfUrl('');
                                    }
                                 }}
                                 className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-[11px] font-mono uppercase cursor-pointer"
                              >
                                 Load
                              </button>
                           </div>

                           <div className="text-[9px] font-mono text-gray-400 border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5 rounded-lg shrink-0">
                              ⚡ Fully Optimized Sandboxed Render
                           </div>
                        </div>

                        {/* Interactive Frame Box for PDF */}
                        <div className="flex-1 min-h-[50vh] relative bg-[#0e0e14] rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between">
                           <iframe 
                              src={pdfUrl.startsWith('blob:') ? pdfUrl : `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`} 
                              className="w-full h-full border-0 rounded-2xl"
                              title="Adobe PDF Frame Reader"
                           />
                        </div>
                     </div>

                     {/* Notes / study companion slide board */}
                     <div className="w-full md:w-80 flex flex-col gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-5 shrink-0 self-stretch min-h-[30vh]">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                           <h4 className="font-serif italic text-purple-400 text-base flex items-center gap-2">
                              <BookOpen className="w-4 h-4" /> Scholar Scribe Notes
                           </h4>
                           <button
                              onClick={() => {
                                 if (window.confirm("Do you want to clear your textbook review notes?")) {
                                    setPdfNotes('');
                                 }
                              }}
                              className="p-1 px-2.5 rounded hover:bg-rose-500/10 text-[8px] font-mono text-gray-550 hover:text-rose-455 uppercase transition-colors"
                           >
                              Clear
                           </button>
                        </div>

                        <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
                           Jot down summaries, equations, and literature reviews side-by-side with your active PDF. Saves automatically per study user.
                        </p>

                        <div className="flex-1 flex flex-col gap-3">
                           <textarea
                              value={pdfNotes}
                              onChange={(e) => setPdfNotes(e.target.value)}
                              placeholder="Write your thesis notes or highlight reflections here..."
                              className="flex-1 w-full min-h-[180px] md:min-h-0 bg-[#08080c] border border-white/10 rounded-xl p-4 text-xs text-stone-200 focus:outline-none focus:border-purple-500/50 font-mono resize-none leading-relaxed"
                           />
                           
                           <div className="flex items-center gap-1 text-[8.5px] font-mono text-emerald-400/80 uppercase">
                              <Check className="w-3 h-3 text-emerald-400" /> Auto-sync secured to cloud profile
                           </div>
                        </div>
                     </div>
                  </div>
                )}


                {/* DYNAMIC SCENE 8: SPACED REPETITION REVISION TRACKER */}
                {activeOverlay === 'revision' && (
                  <div className="space-y-6 flex flex-col md:flex-row gap-8 h-full">
                     
                     {/* Left revision adder compiler */}
                     <div className="w-full md:w-80 border-r border-white/5 pr-6 space-y-4">
                        <span className="text-xs uppercase font-mono tracking-wider text-gray-500 block border-b border-white/5 pb-2">COMPILE TRACK TOPIC</span>

                        <form onSubmit={handleAddRevision} className="space-y-4">
                           <div>
                              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Topic Description</label>
                              <input 
                                type="text"
                                required
                                value={revNewTopic}
                                onChange={(e) => setRevNewTopic(e.target.value)}
                                placeholder="e.g. Schrodinger dimensional square wells"
                                className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                              />
                           </div>

                           <GlowButton type="submit" className="w-full text-xs font-mono uppercase tracking-widest py-2 rounded-xl">
                              DEPLOY TOPIC BLOCK
                           </GlowButton>
                        </form>
                     </div>

                     {/* Right interactive spaced repetition checklist master with mastery sliders */}
                     <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                           <h4 className="font-serif italic text-lg text-white">Spaced Repetition Mastery Board</h4>
                           <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Memory decay curves model</span>
                        </div>

                        <div className="space-y-3.5">
                           {revisions.map((rev) => {
                             // Color spectrum classes based on mastery percentage
                             let masteryColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                             if (rev.mastery >= 75) {
                               masteryColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                             } else if (rev.mastery >= 45) {
                               masteryColor = 'text-amber-450 bg-amber-500/10 border-amber-500/20';
                             }

                             return (
                               <div key={rev.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 hover:border-white/10 transition-colors">
                                  <div className="flex justify-between items-start gap-3">
                                     <div className="space-y-1.5">
                                        <p className="text-xs font-bold text-gray-200">{rev.topic}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                                           <span>Last Synced Review: {rev.lastReviewedDate}</span>
                                           <span>•</span>
                                           <span className={`px-2 py-0.5 rounded border ${masteryColor}`}>
                                              Level Level {rev.mastery >= 80 ? '5 (Mastered)' : rev.mastery >= 60 ? '4' : rev.mastery >= 40 ? '3' : rev.mastery >= 20 ? '2' : '1'}
                                           </span>
                                        </div>
                                     </div>

                                     <div className="flex items-center gap-2">
                                        {/* Checked complete and Delete button controls */}
                                        <button
                                          onClick={() => handleToggleReviewed(rev.id)}
                                          className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono uppercase font-bold transition-all ${
                                            rev.reviewed 
                                              ? 'bg-emerald-500/10 border-emerald-555 text-emerald-450 shadow-md' 
                                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                          }`}
                                        >
                                           {rev.reviewed ? 'Checked' : 'Mark Reviewed'}
                                        </button>
                                        
                                        <button
                                          onClick={() => handleDeleteRevision(rev.id)}
                                          className="p-1.5 rounded-lg border border-white/5 bg-transparent hover:bg-rose-500/10 text-gray-550 hover:text-rose-400 transition-colors"
                                        >
                                           <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                     </div>
                                  </div>

                                  {/* Custom mastery slider bar */}
                                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                                     <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                                        <span>Concept Mastery Level:</span>
                                        <span className="font-bold text-gray-400">{rev.mastery}%</span>
                                     </div>
                                     <input 
                                       type="range"
                                       min={0}
                                       max={100}
                                       value={rev.mastery}
                                       onChange={(e) => handleUpdateMastery(rev.id, Number(e.target.value))}
                                       className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                                     />
                                  </div>
                               </div>
                             );
                           })}

                           {revisions.length === 0 && (
                             <div className="text-center py-12 space-y-2">
                                <Compass className="w-12 h-12 text-gray-650 mx-auto animate-pulse" />
                                <p className="font-serif italic text-gray-450 text-sm">No revision targets defined. Let's record study schedules.</p>
                             </div>
                           )}
                        </div>

                     </div>

                  </div>
                )}

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ==========================================
   INTERACTIVE REUSABLE SUB-COMPONENTS
   ========================================== */

interface ToolCardProps {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
}

function ToolCard({ icon: Icon, title, desc, color, onClick }: ToolCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard 
        hoverable 
        className={`flex flex-col h-[280px] p-6 justify-between relative border-white/5 bg-white/[0.03] transition-all duration-300 group overflow-hidden ${color}`}
      >
        {/* Abstract design vector elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-purple/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-brand-purple w-fit group-hover:bg-brand-purple group-hover:text-white transition-all duration-300 shadow-sm">
             <Icon className="w-5 h-5" />
          </div>

          <div>
             <h3 className="serif-title text-xl text-white group-hover:text-brand-purple transition-colors duration-350">{title}</h3>
             <p className="text-gray-400 text-xs leading-relaxed mt-2.5 h-16 overflow-hidden line-clamp-3 font-sans">
               {desc}
             </p>
          </div>
        </div>

        {/* Action arrow visual guide */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 group-hover:text-brand-purple group-hover:translate-x-1.5 transition-all duration-300">
          <span>INITIALIZE CORE TOOL</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </GlassCard>
    </motion.div>
  );
}

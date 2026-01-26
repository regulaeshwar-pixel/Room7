import React, { useState, useEffect, useMemo, useRef, useReducer } from 'react';
import {
  CheckCircle2,
  Circle,
  Droplets,
  ShoppingCart,
  Utensils,
  Moon,
  Sun,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  Menu,
  X,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Leaf,
  Minus,
  Lock,
  Undo2,
  LogOut,
  Bell,
  AlertTriangle,
  Info,
  GripVertical,
  Ban,
  Shield,
  Eye,
  EyeOff,
  PartyPopper
} from 'lucide-react';

import ChangeLog from './views/ChangeLog';
import DashboardView from './views/DashboardView';
import ExpensesView from './views/ExpensesView';
import SettingsScreen from './views/SettingsScreen';
import MonthlySummary from './views/MonthlySummary';
import MemberLogin from './views/MemberLogin';
import useAuth from './hooks/useAuth';
import { saveUser, loadUser, clearUser } from './utils/session';
import { db } from './firebase';
import { doc, onSnapshot, collection, updateDoc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from './utils/helpers';
import { haptic } from './utils/haptics';
import { useSyncStatus } from './hooks/useSyncStatus';


// --- INITIAL DATA ---

const ROOM_ID = 'flowhouse-main'; // Restoring ROOM_ID
const INITIAL_MEMBERS = [
  { id: 'm1', name: 'Charan', role: 'Cook', avatar: 'CH', pin: '0000' },
  { id: 'm2', name: 'Srinath', role: 'Member', avatar: 'SN', pin: '0000' },
  { id: 'm3', name: 'Shashi', role: 'Member', avatar: 'SH', pin: '0000' },
  { id: 'm4', name: 'Srikanth', role: 'Member', avatar: 'SK', pin: '0000', streak: { current: 0, best: 0 } },
  { id: 'm5', name: 'Abhilash', role: 'Member', avatar: 'AB', pin: '0000', streak: { current: 0, best: 0 } },
  { id: 'm6', name: 'Eshwar', role: 'Member', avatar: 'ES', pin: '0000', streak: { current: 0, best: 0 } },
  { id: 'm7', name: 'Sai', role: 'Member', avatar: 'SA', pin: '0000', streak: { current: 0, best: 0 } },
];

const GUEST_USER = { id: 'guest', name: 'Guest', role: 'Visitor', avatar: 'GS' };

const DEFAULT_SCHEDULE = {
  Monday: { morningDish: ['m2'], nightDish: ['m3'], cleaning: ['m4'], market: ['m2', 'm5'] },
  Tuesday: { morningDish: ['m6'], nightDish: ['m4'], cleaning: ['m5'], market: [] },
  Wednesday: { morningDish: ['m5'], nightDish: ['m7'], cleaning: ['m6'], market: ['m3', 'm4'] },
  Thursday: { morningDish: ['m3'], nightDish: ['m6'], cleaning: ['m7'], market: [] },
  Friday: { morningDish: ['m4'], nightDish: ['m2'], cleaning: ['m3'], market: ['m6', 'm7'] },
  Saturday: { morningDish: ['m7'], nightDish: ['m5'], cleaning: ['m2'], market: [] },
  Sunday1: { morningDish: ['m4'], nightDish: ['m5'], cleaning: ['m3', 'm6'], market: ['m2', 'm7'] },
  Sunday2: { morningDish: ['m2'], nightDish: ['m7'], cleaning: ['m4', 'm5'], market: ['m3', 'm6'] },
  Sunday3: { morningDish: ['m6'], nightDish: ['m3'], cleaning: ['m2', 'm7'], market: ['m4', 'm5'] },
};

const TIME_WINDOWS = {
  cookingMorning: { start: 9, end: 13 },
  cookingNight: { start: 20, end: 23 },
  dishMorning: { start: 9, end: 12 },
  dishNight: { start: 19, end: 22 },
};

const HANDLER_PIN = "2929";

// --- CONSTANTS ---
const CATEGORY_GROCERIES = 'groceries';
const CATEGORY_VEGETABLES = 'vegetables';
const INITIAL_EXPECTED_AMOUNTS = {
  [CATEGORY_GROCERIES]: 1000,
  [CATEGORY_VEGETABLES]: 500,
};

// --- NOTIFICATION CONSTANTS ---
const NOTIFICATION_TYPES = {
  LOW_WATER: 'LOW_WATER',
  VEG_NEGATIVE: 'VEG_NEGATIVE',
  COOKING_DELAYED: 'COOKING_DELAYED',
  WATER_DUTY: 'WATER_DUTY',
  COOKING_PENDING: 'COOKING_PENDING',
  DISH: 'DISH',
  CLEANING: 'CLEANING',
  MARKET: 'MARKET',
  COOKING_WINDOW: 'COOKING_WINDOW',
  UPCOMING_DUTY: 'UPCOMING_DUTY',
  VEG_LOW: 'VEG_LOW',
  FINANCE_INFO: 'FINANCE_INFO',
  GROUP_SOCIAL: 'GROUP_SOCIAL',
  TRANSIENT: 'TRANSIENT',
};

const NOTIFICATION_PRIORITY = [
  NOTIFICATION_TYPES.LOW_WATER,
  NOTIFICATION_TYPES.VEG_NEGATIVE,
  NOTIFICATION_TYPES.COOKING_DELAYED,
  NOTIFICATION_TYPES.WATER_DUTY,
  NOTIFICATION_TYPES.COOKING_PENDING,
  NOTIFICATION_TYPES.DISH,
  NOTIFICATION_TYPES.CLEANING,
  NOTIFICATION_TYPES.MARKET,
  NOTIFICATION_TYPES.COOKING_WINDOW,
  NOTIFICATION_TYPES.UPCOMING_DUTY,
  NOTIFICATION_TYPES.VEG_LOW,
  NOTIFICATION_TYPES.FINANCE_INFO,
  NOTIFICATION_TYPES.GROUP_SOCIAL,
];

// --- UTILITY FUNCTIONS ---


const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

// --- REDUCER FOR NOTIFICATIONS ---

const initialNotificationState = {
  persistent: [],
  transient: null,
  dismissed: {},
  ready: false,
  devMode: false,
};

function notificationReducer(state, action) {
  switch (action.type) {
    case 'READY':
      return { ...state, ready: true };
    case 'SET_PERSISTENT':
      return { ...state, persistent: action.payload };
    case 'SHOW_TRANSIENT':
      return { ...state, transient: action.payload };
    case 'CLEAR_TRANSIENT':
      return { ...state, transient: null };
    case 'DISMISS':
      return {
        ...state,
        dismissed: {
          ...state.dismissed,
          [action.payload.type]: Date.now() + action.payload.ttl,
        },
      };
    case 'TOGGLE_DEV_MODE':
      return { ...state, devMode: !state.devMode };
    case 'RESET':
      return { ...initialNotificationState, ready: state.ready, devMode: state.devMode };
    default:
      return state;
  }
}

// --- COMPONENTS ---

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'neutral' }) => {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[variant]}`}>{children}</span>;
};

const MemberAvatar = ({ name, code, size = 'sm', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border-2 border-white shadow-sm ${className}`} title={name}>
      {code}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
    {icon}<span className="text-[10px] font-medium">{label}</span>
  </button>
);

const ActionButton = ({ onClick, done, label }) => (
  <button onClick={onClick} className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
    {done ? <CheckCircle2 size={16} /> : null}{done ? 'Completed' : label}
  </button>
);

// --- SWIPEABLE NOTIFICATION COMPONENT ---

const SwipeableNotification = ({ alert, onDismiss }) => {
  const [translateX, setTranslateX] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const startX = useRef(null);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setTranslateX(diff);
    setOpacity(Math.max(0, 1 - Math.abs(diff) / 250));
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (Math.abs(translateX) > 100) {
      setTranslateX(translateX > 0 ? 500 : -500);
      setOpacity(0);
      setTimeout(() => onDismiss(alert), 300);
    } else {
      setTranslateX(0);
      setOpacity(1);
    }
    startX.current = null;
  };

  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const currentX = e.clientX;
    const diff = currentX - startX.current;
    setTranslateX(diff);
    setOpacity(Math.max(0, 1 - Math.abs(diff) / 250));
  };
  const handleMouseUp = () => {
    if (!isDragging.current) return;
    handleTouchEnd();
  };
  const handleMouseLeave = () => {
    if (isDragging.current) handleTouchEnd();
  };

  const variant = alert.variant || 'info';

  const styles = {
    danger: { bg: 'bg-rose-50', iconBg: 'bg-rose-100 text-rose-600', text: 'text-rose-900', border: 'border-rose-100' },
    warning: { bg: 'bg-amber-50', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-900', border: 'border-amber-100' },
    success: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-900', border: 'border-emerald-100' },
    info: { bg: 'bg-white', iconBg: 'bg-slate-100 text-slate-600', text: 'text-slate-700', border: 'border-slate-100' },
    social: { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-900', border: 'border-indigo-100' }
  };

  const activeStyle = styles[variant] || styles.info;

  let Icon = Info;
  if (variant === 'danger') Icon = AlertTriangle;
  if (variant === 'warning') Icon = Bell;
  if (variant === 'success') Icon = CheckCircle2;
  if (variant === 'social') Icon = PartyPopper;

  if (alert.type === NOTIFICATION_TYPES.COOKING_DELAYED || alert.type === NOTIFICATION_TYPES.COOKING_PENDING || alert.type === NOTIFICATION_TYPES.COOKING_WINDOW) Icon = Utensils;
  if (alert.type === NOTIFICATION_TYPES.WATER_DUTY || alert.type === NOTIFICATION_TYPES.LOW_WATER) Icon = Droplets;
  if (alert.type === NOTIFICATION_TYPES.MARKET) Icon = ShoppingCart;
  if (alert.type === NOTIFICATION_TYPES.VEG_NEGATIVE || alert.type === NOTIFICATION_TYPES.VEG_LOW) Icon = DollarSign;
  if (alert.type === NOTIFICATION_TYPES.UPCOMING_DUTY) Icon = Calendar;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: opacity,
        transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease'
      }}
      className={`w-full max-w-md shadow-xl rounded-2xl p-4 flex items-start gap-4 pointer-events-auto touch-pan-y relative select-none cursor-grab active:cursor-grabbing border bg-white ${activeStyle.border}`}
    >
      <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activeStyle.iconBg}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 pt-0.5">
        <p className={`text-sm font-semibold leading-tight ${activeStyle.text}`}>{alert.msg}</p>
      </div>
      <div className="shrink-0 opacity-20 text-slate-400 self-center"><GripVertical size={20} /></div>
    </div>
  );
};

// --- CUSTOM HOOK: SMART NOTIFICATIONS ---

function useSmartNotifications(context) {
  const [state, dispatch] = useReducer(notificationReducer, initialNotificationState);

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'READY' }), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state.transient) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_TRANSIENT' }), 3000);
      return () => clearTimeout(t);
    }
  }, [state.transient]);

  useEffect(() => {
    if (!state.ready) return;
    if (!context.currentUser) return; // Guard clause for logged out state

    const now = Date.now();
    const alerts = [];

    const canShow = (type) =>
      state.devMode || (!state.dismissed[type] || state.dismissed[type] < now);

    if (context.isWaterLow && canShow(NOTIFICATION_TYPES.LOW_WATER)) {
      alerts.push({
        type: NOTIFICATION_TYPES.LOW_WATER,
        msg: "🚨 URGENT: Water level is LOW! Please arrange a can.",
        variant: 'danger',
      });
    }

    const isHandler = context.currentUser.id === context.vegHandlerId || state.devMode;
    if (isHandler && context.vegBalance < 0 && canShow(NOTIFICATION_TYPES.VEG_NEGATIVE)) {
      alerts.push({
        type: NOTIFICATION_TYPES.VEG_NEGATIVE,
        msg: `🚨 Veg fund is negative (${formatCurrency(context.vegBalance)}). Immediate collection needed.`,
        variant: 'danger'
      });
    }

    // Water Duty - Only show for members in ACTIVE PAIRS, not available pool
    const activePairs = context.waterPairs.filter(p => p.status === 'pending' && !p.archived);
    const isInActivePair = activePairs.some(p => p.members.includes(context.currentUser.id));

    if (isInActivePair && canShow(NOTIFICATION_TYPES.WATER_DUTY)) {
      alerts.push({
        type: NOTIFICATION_TYPES.WATER_DUTY,
        msg: "💧 Your turn for Water Duty today.",
        variant: 'warning',
      });
    }

    const isCook = context.currentUser.role === 'Cook' || state.devMode;
    const { currentHour, getTaskStatus } = context;
    if (isCook) {
      if (currentHour >= TIME_WINDOWS.cookingMorning.start && currentHour < TIME_WINDOWS.cookingMorning.end && getTaskStatus('cook-morning') !== 'done') {
        const timeElapsed = currentHour - TIME_WINDOWS.cookingMorning.start;
        if (timeElapsed >= 2 && canShow(NOTIFICATION_TYPES.COOKING_DELAYED)) {
          alerts.push({ type: NOTIFICATION_TYPES.COOKING_DELAYED, msg: "⚠️ Food preparation delayed > 2 hrs.", variant: 'danger' });
        } else if (timeElapsed >= 1 && canShow(NOTIFICATION_TYPES.COOKING_PENDING)) {
          alerts.push({ type: NOTIFICATION_TYPES.COOKING_PENDING, msg: "⏰ Cooking is still pending.", variant: 'warning' });
        } else if (canShow(NOTIFICATION_TYPES.COOKING_WINDOW)) {
          alerts.push({ type: NOTIFICATION_TYPES.COOKING_WINDOW, msg: "🍳 Morning cooking window has started.", variant: 'info' });
        }
      }
      else if (currentHour >= TIME_WINDOWS.cookingNight.start && currentHour < TIME_WINDOWS.cookingNight.end && getTaskStatus('cook-night') !== 'done') {
        const timeElapsed = currentHour - TIME_WINDOWS.cookingNight.start;
        if (timeElapsed >= 2 && canShow(NOTIFICATION_TYPES.COOKING_DELAYED)) {
          alerts.push({ type: NOTIFICATION_TYPES.COOKING_DELAYED, msg: "⚠️ Food preparation delayed > 2 hrs.", variant: 'danger' });
        } else if (timeElapsed >= 1 && canShow(NOTIFICATION_TYPES.COOKING_PENDING)) {
          alerts.push({ type: NOTIFICATION_TYPES.COOKING_PENDING, msg: "⏰ Cooking is still pending.", variant: 'warning' });
        } else if (canShow(NOTIFICATION_TYPES.COOKING_WINDOW)) {
          alerts.push({ type: NOTIFICATION_TYPES.COOKING_WINDOW, msg: "🍳 Night cooking window has started.", variant: 'info' });
        }
      }
    }

    const marketUser = context.dailySchedule.market?.includes(context.currentUser.id) || state.devMode;
    if (marketUser && getTaskStatus('market') !== 'done' && canShow(NOTIFICATION_TYPES.MARKET)) {
      const variant = currentHour >= 12 ? 'warning' : 'info';
      alerts.push({ type: NOTIFICATION_TYPES.MARKET, msg: "🛒 You're assigned to market duty today.", variant });
    }

    const morningDishUser = context.dailySchedule.morningDish?.includes(context.currentUser.id) || state.devMode;
    const nightDishUser = context.dailySchedule.nightDish?.includes(context.currentUser.id) || state.devMode;
    if (canShow(NOTIFICATION_TYPES.DISH)) {
      if (morningDishUser && getTaskStatus('dish-morning') !== 'done' && currentHour >= 9) {
        alerts.push({ type: NOTIFICATION_TYPES.DISH, msg: "🍽️ Morning Dishes assigned to you.", variant: 'warning' });
      } else if (nightDishUser && getTaskStatus('dish-night') !== 'done' && currentHour >= 19) {
        alerts.push({ type: NOTIFICATION_TYPES.DISH, msg: "🍽️ Night Dishes assigned to you.", variant: 'warning' });
      }
    }

    const cleaningUser = context.dailySchedule.cleaning?.includes(context.currentUser.id) || state.devMode;
    if (cleaningUser && getTaskStatus('cleaning') !== 'done' && canShow(NOTIFICATION_TYPES.CLEANING)) {
      alerts.push({ type: NOTIFICATION_TYPES.CLEANING, msg: "🧹 You're on cleaning duty today.", variant: 'warning' });
    }

    if (canShow(NOTIFICATION_TYPES.UPCOMING_DUTY) && currentHour >= 20) {
      const tomorrow = new Date(context.simulatedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    if (isHandler && context.vegBalance >= 0 && context.vegBalance < 200 && canShow(NOTIFICATION_TYPES.VEG_LOW)) {
      alerts.push({
        type: NOTIFICATION_TYPES.VEG_LOW,
        msg: `🥗 Veg Fund is running low — ${formatCurrency(context.vegBalance)} left.`,
        variant: 'warning'
      });
    }

    if (context.hasCompletedAllTasks && canShow(NOTIFICATION_TYPES.GROUP_SOCIAL)) {
      alerts.push({
        type: NOTIFICATION_TYPES.GROUP_SOCIAL,
        msg: "🙌 All duties completed today. Great job everyone! 🎉",
        variant: 'social'
      });
    }

    alerts.sort((a, b) =>
      NOTIFICATION_PRIORITY.indexOf(a.type) - NOTIFICATION_PRIORITY.indexOf(b.type)
    );

    const finalAlerts = state.devMode ? alerts : alerts.slice(0, 2);
    dispatch({ type: 'SET_PERSISTENT', payload: finalAlerts });

  }, [
    context.isWaterLow, context.waterPairs, context.schedule, context.tasks,
    context.currentUser, context.vegBalance, context.simulatedDate,
    state.ready, state.dismissed, state.devMode, context.dailySchedule
  ]);

  return { state, dispatch };
}

// --- MAIN APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const scrollRef = useRef(null);

  const TABS = ['dashboard', 'schedule', 'expenses', 'settings'];

  const scrollToTab = (tab) => {
    setActiveTab(tab);
    const index = TABS.indexOf(tab);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    if (TABS[index] && TABS[index] !== activeTab) {
      setActiveTab(TABS[index]);
    }
  };

  const [members, setMembers] = useState(INITIAL_MEMBERS);



  /* AUTH: Ensure anonymous login for Firestore access */
  useAuth();


  /* INITIALIZATION: Try to load user from local session */
  const [currentUser, setCurrentUser] = useState(() => {
    return loadUser();
  });

  /* EFFECT: Persist currentUser to session whenever it changes */
  useEffect(() => {
    if (currentUser) {
      saveUser(currentUser);
    } else {
      clearUser();
    }
  }, [currentUser]);

  const [vegHandlerId, setVegHandlerId] = useState(null);

  const [simulatedDate, setSimulatedDate] = useState(new Date());
  const [sundayVariant, setSundayVariant] = useState(1);

  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  /* Initialize tasks as null to indicate loading state */
  const [tasks, setTasks] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const [vegCollections, setVegCollections] = useState([]);
  const [vegExpenses, setVegExpenses] = useState([]);
  const [vegExemptions, setVegExemptions] = useState([]);
  const [expectedAmounts, setExpectedAmounts] = useState(INITIAL_EXPECTED_AMOUNTS);

  const [includeCook, setIncludeCook] = useState(false);
  const [waterPairs, setWaterPairs] = useState([]);
  const [waterSelection, setWaterSelection] = useState([]);
  const [lastCycleSummary, setLastCycleSummary] = useState(null); // Tracking cycle completion
  const [isWaterLow, setIsWaterLow] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [changeLog, setChangeLog] = useState([]);
  const [roomMetadata, setRoomMetadata] = useState(null);
  const [houseNote, setHouseNote] = useState(null);
  const [exemptMembers, setExemptMembers] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    // 1. Room Metadata Listener
    const roomRef = doc(db, 'rooms', ROOM_ID);
    const unsubRoom = onSnapshot(roomRef, { includeMetadataChanges: true }, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fromRemote = !(snap.metadata?.hasPendingWrites ?? false);

        if (data.members) {
          // STEP 1: Initialize streaks safely (Phase D)
          const normalizedMembers = data.members.map(m => ({
            ...m,
            streak: m.streak ?? { current: 0, best: 0 }
          }));
          setMembers(normalizedMembers);
        }
        if (data.schedule) setSchedule(data.schedule);
        if (data.vegHandlerId !== undefined) setVegHandlerId(data.vegHandlerId);
        if (data.includeCook !== undefined) setIncludeCook(data.includeCook);
        if (data.expectedAmounts) setExpectedAmounts(data.expectedAmounts);
        if (data.isWaterLow !== undefined) setIsWaterLow(data.isWaterLow);
        if (data.vegExemptions) setVegExemptions(data.vegExemptions);
        if (data.exemptMembers) setExemptMembers(data.exemptMembers);
        if (data.isFrozen !== undefined) setIsFrozen(data.isFrozen);

        if (data.changeLog) setChangeLog(data.changeLog);
        if (data.houseNote) setHouseNote(data.houseNote);
        if (data.updatedAt) setRoomMetadata({
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });

        // T3: Remote Change Detection
        if (fromRemote && data.updatedBy && data.updatedBy !== currentUser?.name) {
          // Simple diff
          const changes = Object.keys(data).filter(key =>
            JSON.stringify(data[key]) !== JSON.stringify(prevRoomData.current[key])
          );

          if (changes.length > 0) {
            setLastRemoteUpdate({ by: data.updatedBy, at: Date.now() });
            setRecentlyUpdatedFields(changes);
            haptic.light();
          }
        }
        prevRoomData.current = data;
      }
    });

    // Auto-clear exemptions when day changes (Phase T6+)
    const todayStr = simulatedDate.toDateString();
    if (prevDayStr.current && prevDayStr.current !== todayStr) {
      if (exemptMembers.length > 0) {
        updateRoom({ exemptMembers: [] }, "Cleared exemptions for new day");
      }
    }
    prevDayStr.current = todayStr;

    // 2. Collections Listeners
    const tasksRef = collection(db, 'rooms', ROOM_ID, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const taskMap = {};
      snap.forEach(doc => { taskMap[doc.id] = doc.data() });
      setTasks(taskMap);
    });

    const expensesRef = collection(db, 'rooms', ROOM_ID, 'expenses');
    const unsubExpenses = onSnapshot(expensesRef, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setExpenses(list);
    });

    const vegColRef = collection(db, 'rooms', ROOM_ID, 'vegCollections');
    const unsubVegCol = onSnapshot(vegColRef, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setVegCollections(list);
    });

    const vegExpRef = collection(db, 'rooms', ROOM_ID, 'vegExpenses');
    const unsubVegExp = onSnapshot(vegExpRef, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setVegExpenses(list);
    });

    const waterPairsRef = collection(db, 'rooms', ROOM_ID, 'waterPairs');
    const unsubWaterPairs = onSnapshot(waterPairsRef, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setWaterPairs(list);
    });

    return () => {
      unsubRoom();
      unsubTasks();
      unsubExpenses();
      unsubVegCol();
      unsubVegExp();
      unsubWaterPairs();
    };
  }, []);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState("handler");
  const [pendingTargetId, setPendingTargetId] = useState(null);
  const [pinError, setPinError] = useState("");
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState(null);
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState([]);
  const prevRoomData = useRef({});
  const prevDayStr = useRef("");
  const [theme, setTheme] = useState(() => localStorage.getItem("flowhouse_theme") || "light");

  useEffect(() => {
    localStorage.setItem("flowhouse_theme", theme);
  }, [theme]);

  const updateRoom = async (updates, logText = null) => {
    if (!currentUser) return;
    const roomRef = doc(db, 'rooms', ROOM_ID);

    const payload = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.name,
    };

    if (logText) {
      // Optimistic or based on current state. Since we have changeLog in state, we can append to it.
      // Firestore arrayUnion doesn't really work well for "rolling logs" (slicing).
      // So we read from our local state wrapper.
      // NOTE: This assumes `changeLog` state is up to date.
      payload.changeLog = [
        ...(changeLog || []),
        {
          text: logText,
          by: currentUser.name,
          at: new Date().toISOString(),
        },
      ].slice(-20); // Keep last 20
    }

    if (!navigator.onLine) {
      setOfflineQueueCount(c => c + 1);
    }

    await updateDoc(roomRef, payload);
  };


  const isGuest = false; // "Guest" mode is effectively removed as per Phase 4 strict login.
  const currentDayName = useMemo(() => {
    const day = getDayName(simulatedDate);
    if (day === 'Sunday') return `Sunday${sundayVariant}`;
    return day;
  }, [simulatedDate, sundayVariant]);

  const dailySchedule = useMemo(() => schedule[currentDayName] || {}, [schedule, currentDayName]);
  const currentHour = simulatedDate.getHours();

  // Phase T7: Read-only mode when frozen (non-admins)
  const isAdmin = currentUser?.id === vegHandlerId;
  const isReadOnly = isFrozen && !isAdmin;

  const totalVegGiven = vegCollections.reduce((sum, c) => sum + c.amount, 0);
  const totalVegExpenses = vegExpenses.reduce((sum, e) => sum + e.amount, 0);
  const vegBalance = totalVegGiven - totalVegExpenses;
  const totalGeneralExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMonthlyExpenses = totalGeneralExpenses + totalVegExpenses;

  const getTaskStatus = (taskId) => {
    if (tasks === null) return 'loading'; // New value
    const key = `${simulatedDate.toDateString()}-${taskId}`;
    return tasks[key]?.status || 'pending';
  };

  const hasCompletedAllTasks = useMemo(() => {
    const todayTasks = [];
    if (dailySchedule.morningDish) todayTasks.push('dish-morning');
    if (dailySchedule.nightDish) todayTasks.push('dish-night');
    if (dailySchedule.cleaning) todayTasks.push('cleaning');
    if (dailySchedule.market && dailySchedule.market.length > 0) todayTasks.push('market');
    todayTasks.push('cook-morning');
    todayTasks.push('cook-night');

    if (todayTasks.length === 0) return false;
    return todayTasks.every(t => getTaskStatus(t) === 'done');
  }, [dailySchedule, tasks, simulatedDate]);


  const notificationContext = useMemo(() => ({
    isWaterLow,
    waterPairs,
    schedule,
    dailySchedule,
    tasks,
    currentUser,
    vegBalance,
    simulatedDate,
    vegHandlerId,
    currentHour,
    getTaskStatus,
    hasCompletedAllTasks
  }), [isWaterLow, waterPairs, schedule, dailySchedule, tasks, currentUser, vegBalance, simulatedDate, vegHandlerId, currentHour, hasCompletedAllTasks]);

  const { state: notificationState, dispatch: notifyDispatch } = useSmartNotifications(notificationContext);

  const triggerAlert = (msg, type = 'danger') => {
    notifyDispatch({ type: 'SHOW_TRANSIENT', payload: { msg, variant: type } });
  };

  const triggerDemoNotifications = () => {
    triggerAlert("✅ Logged in successfully", 'success');
    setTimeout(() => triggerAlert("⚠️ Cooking is still pending", 'warning'), 1000);
    setTimeout(() => triggerAlert("🚨 Water empty. Call supplier immediately.", 'danger'), 2000);
    setTimeout(() => triggerAlert("🙌 All duties completed today 🎉", 'social'), 3000);
  };

  const dismissAlert = (alert) => {
    let ttl = 60 * 60 * 1000;
    if (alert.type === NOTIFICATION_TYPES.LOW_WATER || alert.type === NOTIFICATION_TYPES.VEG_NEGATIVE) ttl = 15 * 60 * 1000;
    if (alert.type === NOTIFICATION_TYPES.WATER_DUTY) ttl = 30 * 60 * 1000;
    if (alert.type === NOTIFICATION_TYPES.COOKING_WINDOW) ttl = 4 * 60 * 60 * 1000;

    notifyDispatch({
      type: 'DISMISS',
      payload: { type: alert.type, ttl }
    });
  };

  const initiateUserSwitch = (targetUser) => {
    if (targetUser.id === currentUser.id) return;
    setPendingTargetId(targetUser.id);
    setPinMode("login");
    setPinError("");
    setShowPinModal(true);
  };

  const logout = () => {
    setCurrentUser(null);
    notifyDispatch({ type: 'RESET' });
  };

  const initiateHandlerToggle = (memberId) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (vegHandlerId === memberId) {
      setVegHandlerId(null);
    } else {
      if (!vegHandlerId) {
        setPendingTargetId(memberId);
        setPinMode("handler");
        setPinError("");
        setShowPinModal(true);
      }
    }
  };

  const confirmPin = async (e) => {
    e.preventDefault();
    if (pinMode === "handler") {
      if (pinInput === HANDLER_PIN) {
        haptic.success();
        await updateRoom({ vegHandlerId: pendingTargetId }, `${currentUser?.name || 'Someone'} became Veg Handler`);
        setShowPinModal(false);
        setPinInput("");
        setPendingTargetId(null);
        setPinError("");
        triggerAlert("Veg Handler Access Granted", "success");
      } else {
        haptic.error();
        setPinError("❌ Incorrect Handler PIN");
        setPinInput("");
      }
    } else {
      const targetUser = members.find(m => m.id === pendingTargetId);
      if (targetUser && pinInput === targetUser.pin) {
        haptic.success();
        setCurrentUser(targetUser);
        setShowPinModal(false);
        setPinInput("");
        setPendingTargetId(null);
        setPinError("");
        triggerAlert(`✅ Welcome back, ${targetUser.name}`, "success");
      } else {
        haptic.error();
        setPinError("❌ Incorrect User PIN");
        setPinInput("");
      }
    }
  };

  const toggleWaterLow = async () => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const newState = !isWaterLow;
    await updateRoom({ isWaterLow: newState }, newState ? "Reported LOW WATER" : "Marked water as REFILLED");
    if (newState) {
      triggerAlert("Low Water Alert broadcasted.", "danger");
    } else {
      triggerAlert("Water status marked as Normal.", "success");
    }
  };

  const waterPool = useMemo(() => {
    const activeIds = new Set();
    Object.values(schedule).forEach(day => {
      Object.values(day).forEach(roleArray => {
        roleArray.forEach(id => activeIds.add(id));
      });
    });
    let pool = Array.from(activeIds);
    const cook = members.find(m => m.role === 'Cook');
    if (cook) {
      if (includeCook) {
        if (!pool.includes(cook.id)) pool.push(cook.id);
      } else {
        pool = pool.filter(id => id !== cook.id);
      }
    }
    const pairedMembers = new Set();
    waterPairs.filter(p => !p.archived && p.status === 'pending').forEach(p => p.members.forEach(m => pairedMembers.add(m)));
    return pool.filter(id => !pairedMembers.has(id) && !exemptMembers.includes(id)).sort();
  }, [schedule, includeCook, waterPairs, exemptMembers]);

  useEffect(() => {
    if (waterPool.length === 2 && waterSelection.length === 0) {
      // Auto-create pair if only 2 people left.
      // Leader check: Only the first alphabetic ID creates it to avoid race conditions.
      // And we must be logged in.
      if (!currentUser) return;
      const sortedMembers = [...waterPool].sort();
      if (currentUser.id === sortedMembers[0]) {
        const newPair = { members: sortedMembers, status: 'pending', timestamp: new Date().toISOString() };
        addDoc(collection(db, 'rooms', ROOM_ID, 'waterPairs'), newPair);
      }
    }
  }, [waterPool, waterSelection, currentUser]);

  const toggleWaterSelection = (id) => {
    if (isGuest) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (waterSelection.includes(id)) {
      haptic.light();
      setWaterSelection(prev => prev.filter(mid => mid !== id));
    } else {
      if (waterSelection.length < 2) {
        haptic.light();
        setWaterSelection(prev => [...prev, id]);
      }
    }
  };

  const toggleExemption = (memberId) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const isExempt = exemptMembers.includes(memberId);
    const updated = isExempt ? [] : [memberId]; // Only one exempt at a time for now

    const memberName = members.find(m => m.id === memberId)?.name || 'Member';
    updateRoom({ exemptMembers: updated }, isExempt ? `${currentUser.name} cleared exemption` : `${currentUser.name} marked ${memberName} exempt`);
    haptic.light();
  };

  const createManualPair = () => {
    if (isGuest) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (waterSelection.length !== 2) return;
    const newPair = { members: [...waterSelection], status: 'pending', timestamp: new Date().toISOString() };
    addDoc(collection(db, 'rooms', ROOM_ID, 'waterPairs'), newPair);
    setWaterSelection([]);
    updateRoom({ exemptMembers: [] }); // Auto-clear exemptions on assignment
    haptic.success();
    triggerAlert("Water Pair Created", "success");
  };





  const markPairDone = (pairId) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const pair = waterPairs.find(p => p.id === pairId); // Fetch pair to get members
    if (!pair) return;

    const path = `rooms/${ROOM_ID}/waterPairs/${String(pairId)}`;
    updateDoc(doc(db, path), { status: 'done', completedAt: new Date().toISOString() });

    // Log the action to the room
    const memberNames = pair.members.map(mid => members.find(m => m.id === mid)?.name).join(' & ');
    updateRoom({}, `${currentUser.name} marked Water Duty done for ${memberNames}`);

    haptic.success();
    triggerAlert("Water Duty Completed.", "success");
  };

  const undoPair = (pairId) => {
    if (isGuest) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const pair = waterPairs.find(p => p.id === pairId);
    if (!pair) return;
    const isHandler = currentUser.id === vegHandlerId;
    if (pair.status === 'done' && !isHandler) {
      triggerAlert("Only Veg Handler can undo completed pair.", "danger");
      return;
    }
    deleteDoc(doc(db, `rooms/${ROOM_ID}/waterPairs/${String(pairId)}`));
    haptic.medium();
  };



  const resetWaterCycle = () => {
    if (isGuest) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }

    const confirmed = window.confirm(
      "This will archive all water duty history and clear exemptions. This cannot be undone. Continue?"
    );
    if (!confirmed) return;

    waterPairs.forEach(p => updateDoc(doc(db, `rooms/${ROOM_ID}/waterPairs/${String(p.id)}`), { archived: true }));
    setWaterSelection([]);
    updateRoom({ exemptMembers: [] }, "Reset Water Cycle (Archived all & cleared exemptions)");
  };

  const updateSchedule = (day, role, newMemberIds) => {
    if (isGuest) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const newSchedule = { ...schedule, [day]: { ...schedule[day], [role]: newMemberIds } };
    updateRoom({ schedule: newSchedule }, `Updated ${day} schedule for ${role}`);
  };

  const toggleTask = (taskId) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (!tasks) return; // Prevent crash if tasks not yet loaded
    haptic.light();
    const key = `${simulatedDate.toDateString()}-${taskId}`;
    const currentStatus = tasks[key]?.status;
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';

    setDoc(doc(db, 'rooms', ROOM_ID, 'tasks', key), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    }, { merge: true });

    // Log the main activity
    const niceTaskName = taskId.replace('-', ' ').toUpperCase();
    updateRoom({}, `${newStatus === 'done' ? 'Completed' : 'Undid'} ${niceTaskName}`);

    if (newStatus === 'done') {
      triggerAlert("Task Completed", "success");
    }
  };

  const addGeneralExpense = (amount, notes) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    addDoc(collection(db, 'rooms', ROOM_ID, 'expenses'), {
      amount: parseFloat(amount),
      paidBy: currentUser.id,
      created: new Date().toISOString()
    });

    updateRoom({}, `Recorded Veg Expense: ${formatCurrency(amount)} (${notes})`);
    triggerAlert("Veg Expense Added", "success");
  };

  const updateHouseNote = (text) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    updateRoom({
      houseNote: {
        text,
        updatedBy: currentUser.name,
        updatedAt: new Date().toISOString() // Using ISO string for client consistency, serverTimestamp is also fine but ISO works with simple logic
      }
    }, `${currentUser.name} updated the house note`);
    haptic.success();
  };

  const toggleFreeze = () => {
    const isAdmin = currentUser.id === vegHandlerId;
    if (!isAdmin) {
      triggerAlert("🔒 Only the Veg Handler can freeze/unfreeze the app", "danger");
      return;
    }

    const next = !isFrozen;
    const confirmed = window.confirm(
      next
        ? "Freeze the app for everyone? Non-admins won't be able to make changes."
        : "Unfreeze the app?"
    );

    if (!confirmed) return;

    updateRoom(
      { isFrozen: next },
      next
        ? `${currentUser.name} froze the app`
        : `${currentUser.name} unfroze the app`
    );
    haptic.medium();
  };

  const addVegCollection = (amount, fromId, category = CATEGORY_VEGETABLES) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (currentUser.id !== vegHandlerId && currentUser.id !== fromId) {
      triggerAlert("You can only add money for yourself.", "danger");
      return;
    }
    const key = `${fromId}-${category}`;
    if (vegExemptions.includes(key)) {
      const newExemptions = vegExemptions.filter(k => k !== key);
      updateDoc(doc(db, 'rooms', ROOM_ID), { vegExemptions: newExemptions });
    }

    addDoc(collection(db, 'rooms', ROOM_ID, 'vegCollections'), {
      amount: parseFloat(amount),
      fromMemberId: fromId,
      date: new Date().toISOString(),
      category: category,
      collectedBy: currentUser.id
    });

    const fromName = members.find(m => m.id === fromId)?.name;
    updateRoom({}, `Collected ${formatCurrency(amount)} from ${fromName} for ${category}`);

    triggerAlert(`Veg Fund (${category}) Updated`, "success");
  };

  const toggleVegExemption = (memberId, category) => {
    if (isGuest || currentUser.id !== vegHandlerId) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const key = `${memberId}-${category}`;
    const newExemptions = vegExemptions.includes(key)
      ? vegExemptions.filter(k => k !== key)
      : [...vegExemptions, key];

    // Simplify log message
    const memName = members.find(m => m.id === memberId)?.name;
    const action = vegExemptions.includes(key) ? "Included" : "Exempted";

    updateRoom({ vegExemptions: newExemptions }, `${action} ${memName} from ${category}`);
    triggerAlert("Member status updated", "info");
  };

  const addVegExpense = (amount, desc) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (currentUser.id !== vegHandlerId) { triggerAlert("Restricted. Veg Handler only.", "danger"); return; }
    addDoc(collection(db, 'rooms', ROOM_ID, 'vegExpenses'), {
      amount: parseFloat(amount),
      desc,
      date: new Date().toISOString(),
      paidBy: currentUser.id
    });

    updateRoom({}, `Spent Veg Fund: ${formatCurrency(amount)} (${desc})`);

    triggerAlert("Veg Fund Expense Added", "success");
  };

  const deleteTransaction = (collectionName, id) => {
    if (isGuest) return;

    const confirmed = window.confirm(
      "Delete this transaction? This cannot be undone."
    );
    if (!confirmed) return;

    deleteDoc(doc(db, 'rooms', ROOM_ID, collectionName, id));
    triggerAlert("Transaction deleted", "info");
  };

  const resetMonth = () => {
    if (isGuest || currentUser.id !== vegHandlerId) return;

    const confirmed = window.confirm(
      "This will clear ALL expenses and veg fund data for everyone. This cannot be undone. Continue?"
    );
    if (!confirmed) return;

    expenses.forEach(e => deleteDoc(doc(db, 'rooms', ROOM_ID, 'expenses', e.id)));
    vegCollections.forEach(c => deleteDoc(doc(db, 'rooms', ROOM_ID, 'vegCollections', c.id)));
    vegExpenses.forEach(e => deleteDoc(doc(db, 'rooms', ROOM_ID, 'vegExpenses', e.id)));
    updateRoom({}, `${currentUser.name} reset the month (cleared all expenses)`);
    triggerAlert("Month reset complete", "success");
  };

  const NotificationBanner = () => {
    if (!notificationState.ready) return null;
    const { persistent, transient } = notificationState;
    return (
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 flex flex-col items-center gap-2 pointer-events-none">
        {transient && (
          <SwipeableNotification
            key={`transient-${Date.now()}`}
            alert={{ ...transient, type: NOTIFICATION_TYPES.TRANSIENT }}
            onDismiss={() => notifyDispatch({ type: 'CLEAR_TRANSIENT' })}
          />
        )}
        {persistent.map(alert => (
          <SwipeableNotification
            key={alert.type}
            alert={alert}
            onDismiss={() => dismissAlert(alert)}
          />
        ))}
      </div>
    );
  };



  const ScheduleEditor = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday1', 'Sunday2', 'Sunday3'];
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [editingRole, setEditingRole] = useState(null);

    const EditModal = () => {
      if (!editingRole) return null;
      const currentAssigned = schedule[selectedDay][editingRole.role] || [];
      const toggleMember = (mid) => {
        haptic.light();
        updateSchedule(selectedDay, editingRole.role, currentAssigned.includes(mid) ? currentAssigned.filter(id => id !== mid) : [...currentAssigned, mid]);
      };
      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">{editingRole.label}</h3><button onClick={() => setEditingRole(null)}><X size={20} /></button></div>
            <div className="space-y-2 max-h-60 overflow-y-auto">{members.map(m => (<button key={m.id} onClick={() => toggleMember(m.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border ${currentAssigned.includes(m.id) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'}`}><div className="flex items-center gap-3"><MemberAvatar name={m.name} code={m.avatar} /><span className="font-medium">{m.name}</span></div>{currentAssigned.includes(m.id) && <CheckCircle2 size={18} className="text-indigo-600" />}</button>))}</div>
            <button onClick={() => setEditingRole(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-4">Done</button>
          </div>
        </div>
      );
    };

    return (
      <div className="pb-8">
        <header className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b border-slate-100 flex flex-col gap-4">
          <h1 className="text-xl font-bold text-slate-800">Schedule Builder</h1>
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">{days.map(day => (<button key={day} onClick={() => setSelectedDay(day)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedDay === day ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{day}</button>))}</div>
        </header>
        <div className="p-4 space-y-4">
          <Card className="p-4 bg-slate-50 border-slate-200 flex justify-between items-center"><div className="flex gap-2 font-bold text-slate-700"><Droplets size={18} className="text-blue-500" /> Water Config</div><button disabled={isGuest} onClick={() => setIncludeCook(!includeCook)} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${includeCook ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{includeCook ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}{includeCook ? 'Cook Included' : 'Cook Excluded'}</button></Card>
          {[{ id: 'morningDish', label: 'Morning Dishes' }, { id: 'nightDish', label: 'Night Dishes' }, { id: 'cleaning', label: 'Cleaning' }, { id: 'market', label: 'Market' }].map(role => (
            <Card key={role.id} className="p-4 relative">
              {!isGuest && <button onClick={() => setEditingRole({ role: role.id, label: role.label })} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-600"><Edit2 size={16} /></button>}
              <span className="uppercase text-xs font-bold text-slate-400 tracking-wider block mb-3">{role.label}</span>
              <div className="flex flex-wrap gap-2 pr-8 min-h-[40px]">{schedule[selectedDay][role.id]?.length > 0 ? schedule[selectedDay][role.id]?.map(id => <div key={id} className="flex items-center gap-2 bg-slate-50 border pr-3 rounded-full"><MemberAvatar name={members.find(m => m.id === id)?.name} code={members.find(m => m.id === id)?.avatar} /><span className="text-sm font-medium">{members.find(m => m.id === id)?.name}</span></div>) : <span className="text-sm text-slate-400 italic">No one assigned</span>}</div>
            </Card>
          ))}
        </div>
        <EditModal />
      </div>
    );
  };





  const SettingsView = () => {
    const [isChangePinOpen, setIsChangePinOpen] = useState(false);
    const [pinFormData, setPinFormData] = useState({ current: '', new: '', confirm: '' });

    const handleChangePin = (e) => {
      e.preventDefault();
      if (pinFormData.current !== currentUser.pin) {
        haptic.error();
        triggerAlert("Current PIN is incorrect", "danger");
        return;
      }
      if (pinFormData.new.length !== 4) {
        haptic.error();
        triggerAlert("New PIN must be 4 digits", "warning");
        return;
      }
      if (pinFormData.new !== pinFormData.confirm) {
        haptic.error();
        triggerAlert("New PINs do not match", "danger");
        return;
      }
      const newPin = pinFormData.new;
      setMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, pin: newPin } : m));
      setCurrentUser(prev => ({ ...prev, pin: newPin }));
      setIsChangePinOpen(false);
      setPinFormData({ current: '', new: '', confirm: '' });
      haptic.success();
      triggerAlert("PIN updated successfully", "success");
    };

    return (
      <div className="p-4 space-y-6 pb-24">
        <h1 className="text-xl font-bold text-slate-800">Profile & Settings</h1>

        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">User Profiles</h3>
            {!isGuest && (
              <button onClick={logout} className="text-xs flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                <LogOut size={12} /> Logout
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {members.map(m => {
              const isThisHandler = vegHandlerId === m.id;
              const showLeaf = (!vegHandlerId) || isThisHandler;
              return (
                <div key={m.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${currentUser.id === m.id ? 'bg-slate-50 border border-slate-200' : ''}`}>
                  <button onClick={() => { haptic.light(); initiateUserSwitch(m); }} className="flex items-center gap-3 text-left flex-1">
                    <MemberAvatar name={m.name} code={m.avatar} />
                    <div><p className={`text-sm font-medium ${currentUser.id === m.id ? 'text-indigo-700' : 'text-slate-700'}`}>{m.name} {currentUser.id === m.id && '(You)'}</p><p className="text-xs text-slate-400">{m.role}</p></div>
                  </button>
                  {showLeaf && !isGuest && (
                    <button onClick={() => { haptic.light(); initiateHandlerToggle(m.id); }} className={`p-2 rounded-full transition-all ${isThisHandler ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 hover:text-emerald-500'}`}>
                      {isThisHandler ? <Lock size={18} /> : <Leaf size={18} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {!isGuest && (
          <Card className="p-4 space-y-4 border-l-4 border-l-slate-800">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Shield size={18} /> Security</h3>
            <button onClick={() => setIsChangePinOpen(true)} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Change My PIN</button>
          </Card>
        )}

        <Card className="p-4 space-y-4">
          <h3 className="font-bold text-slate-700">Dev Tools</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { const d = new Date(simulatedDate); d.setDate(d.getDate() - 1); setSimulatedDate(d); }} className="px-3 py-1 bg-slate-100 rounded text-sm">Prev Day</button>
            <button onClick={() => setSimulatedDate(new Date())} className="px-3 py-1 bg-slate-100 rounded text-sm">Today</button>
            <button onClick={() => { const d = new Date(simulatedDate); d.setDate(d.getDate() + 1); setSimulatedDate(d); }} className="px-3 py-1 bg-slate-100 rounded text-sm">Next Day</button>
            <button onClick={() => setSundayVariant(prev => prev === 3 ? 1 : prev + 1)} className="px-3 py-1 bg-slate-100 rounded text-sm">Toggle Sunday ({sundayVariant})</button>
            <button onClick={() => notifyDispatch({ type: 'TOGGLE_DEV_MODE' })} className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${notificationState.devMode ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
              {notificationState.devMode ? <Eye size={14} /> : <EyeOff size={14} />} Inspection Mode
            </button>
            <button onClick={triggerDemoNotifications} className="px-3 py-1 bg-slate-100 rounded text-sm">Test Alerts</button>
          </div>
        </Card>

        {isChangePinOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Change PIN</h3>
              <form onSubmit={handleChangePin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Current PIN</label>
                  <input type="password" required value={pinFormData.current} onChange={e => setPinFormData({ ...pinFormData, current: e.target.value })} className="w-full p-3 border rounded-xl text-center tracking-widest text-lg" maxLength={4} placeholder="••••" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">New PIN</label>
                  <input type="password" required value={pinFormData.new} onChange={e => setPinFormData({ ...pinFormData, new: e.target.value })} className="w-full p-3 border rounded-xl text-center tracking-widest text-lg" maxLength={4} placeholder="••••" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Confirm New PIN</label>
                  <input type="password" required value={pinFormData.confirm} onChange={e => setPinFormData({ ...pinFormData, confirm: e.target.value })} className="w-full p-3 border rounded-xl text-center tracking-widest text-lg" maxLength={4} placeholder="••••" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsChangePinOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
  /* New Hook usage */
  const { isOnline, isSyncing, hasPendingWrites } = useSyncStatus();

  useEffect(() => {
    if (!hasPendingWrites && navigator.onLine) {
      setOfflineQueueCount(0);
    }
  }, [hasPendingWrites]);
  useEffect(() => {
    if (!lastRemoteUpdate) return;
    const t = setTimeout(() => setLastRemoteUpdate(null), 2500);
    return () => clearTimeout(t);
  }, [lastRemoteUpdate]);

  useEffect(() => {
    if (recentlyUpdatedFields.length === 0) return;
    const t = setTimeout(() => setRecentlyUpdatedFields([]), 2000);
    return () => clearTimeout(t);
  }, [recentlyUpdatedFields]);

  // --- VIEW RENDERING ---

  if (!currentUser) {
    return (
      <MemberLogin
        members={members}
        onLogin={(m) => {
          setCurrentUser(m);
          triggerAlert(`Welcome back, ${m.name}`, "success");
        }}
      />
    );
  }

  return (
    <div className={`max-w-md mx-auto bg-card h-[100dvh] relative shadow-2xl overflow-hidden font-sans text-theme transition-colors duration-300 ${theme}`}>
      {/* Phase T7: Global Freeze Banner */}
      {isFrozen && (
        <div className="bg-slate-800 text-white text-xs text-center py-1.5 px-2 font-medium z-50 relative">
          {isAdmin ? "🧊 App frozen · you can unfreeze in Settings" : "🧊 App is temporarily frozen"}
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory no-scrollbar"
      >
        {/* NAVIGATION: Render active view based on tab */}
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar">
          <DashboardView
            currentUser={currentUser}
            members={members}
            vegHandlerId={vegHandlerId}
            notificationState={notificationState}
            notifyDispatch={notifyDispatch}
            dismissAlert={dismissAlert}
            simulatedDate={simulatedDate}
            currentHour={currentHour}
            dailySchedule={dailySchedule}
            getTaskStatus={getTaskStatus}
            roomMetadata={roomMetadata}
            setShowChangeLog={() => setShowChangeLog(true)}
            waterPairs={waterPairs}
            waterSelection={waterSelection}
            waterPool={waterPool}
            isWaterLow={isWaterLow}
            toggleWaterLow={toggleWaterLow}
            toggleWaterSelection={toggleWaterSelection}
            createManualPair={createManualPair}
            markPairDone={markPairDone}
            undoPair={undoPair}
            resetWaterCycle={resetWaterCycle}
            toggleTask={toggleTask}
            isGuest={isGuest}
            triggerAlert={triggerAlert}
            NotificationBanner={NotificationBanner}
            isOnline={isOnline}
            isSyncing={isSyncing}
            hasPendingWrites={hasPendingWrites}
            offlineQueueCount={offlineQueueCount}
            setShowSummary={setShowSummary}
            recentlyUpdatedFields={recentlyUpdatedFields}
            houseNote={houseNote}
            updateHouseNote={updateHouseNote}
            exemptMembers={exemptMembers}
            toggleExemption={toggleExemption}
            theme={theme}
          />
        </div>
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar">
          <ScheduleEditor
            schedule={schedule}
            members={members}
            updateSchedule={updateSchedule}
            isGuest={currentUser.id === 'guest'}
          />
        </div>
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar">
          <ExpensesView
            expenses={expenses}
            vegExpenses={vegExpenses}
            vegCollections={vegCollections}
            vegExemptions={vegExemptions}
            expectedAmounts={expectedAmounts}
            setExpectedAmounts={(newAmounts) => {
              updateDoc(doc(db, 'rooms', ROOM_ID), { expectedAmounts: newAmounts });
              triggerAlert("Amounts updated", "success");
            }}
            currentUser={currentUser}
            members={members}
            vegHandlerId={vegHandlerId}
            addGeneralExpense={addGeneralExpense}
            addVegCollection={addVegCollection}
            toggleVegExemption={toggleVegExemption}
            addVegExpense={addVegExpense}
            deleteTransaction={deleteTransaction}
            resetMonth={resetMonth}
            triggerAlert={triggerAlert}
            isGuest={isGuest}
            theme={theme}
            setTheme={setTheme}
          />
        </div>
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar">
          <SettingsScreen
            currentUser={currentUser}
            members={members}
            vegHandlerId={vegHandlerId}
            isGuest={isGuest}
            exemptMembers={exemptMembers}
            isFrozen={isFrozen}
            toggleFreeze={toggleFreeze}
            theme={theme}
            setTheme={setTheme}
            logout={logout}
            initiateUserSwitch={initiateUserSwitch}
            initiateHandlerToggle={initiateHandlerToggle}
            simulatedDate={simulatedDate}
            setSimulatedDate={setSimulatedDate}
            setSundayVariant={setSundayVariant}
            sundayVariant={sundayVariant}
            notifyDispatch={notifyDispatch}
            notificationState={notificationState}
            triggerDemoNotifications={triggerDemoNotifications}
            setMembers={setMembers}
            triggerAlert={triggerAlert}
            setCurrentUser={setCurrentUser}
            setShowSummary={setShowSummary}
          />
        </div>
      </div>

      {/* Monthly Summary Overlay */}
      {showSummary && (
        <MonthlySummary
          members={members}
          waterPairs={waterPairs}
          expenses={expenses}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Change Log Overlay */}
      {showChangeLog && (
        <ChangeLog
          changeLog={changeLog}
          onClose={() => setShowChangeLog(false)}
        />
      )}

      {/* Remote Update Toast */}
      {lastRemoteUpdate && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-fade-in z-50 pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Updated by {lastRemoteUpdate.by}
        </div>
      )}

      <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-20">
        <NavButton active={activeTab === 'dashboard'} onClick={() => scrollToTab('dashboard')} icon={<Menu size={20} />} label="Today" />
        <NavButton active={activeTab === 'schedule'} onClick={() => scrollToTab('schedule')} icon={<Calendar size={20} />} label="Schedule" />
        <NavButton active={activeTab === 'expenses'} onClick={() => scrollToTab('expenses')} icon={<DollarSign size={20} />} label="Expenses" />
        <NavButton active={activeTab === 'settings'} onClick={() => scrollToTab('settings')} icon={<Users size={20} />} label="Profile" />
      </nav>
      {/* Global PIN Modal - Rendered outside of tabs */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Enter PIN</h3>
            <p className="text-xs text-slate-500 mb-4">{pinMode === 'handler' ? 'Veg Handler Access' : `Login as ${members.find(m => m.id === pendingTargetId)?.name}`}</p>
            <form onSubmit={confirmPin}>
              <input
                type="password"
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(""); }}
                className={`w-full text-center text-2xl tracking-widest p-2 border rounded-xl mb-4 focus:outline-none focus:ring-2 ${pinError ? 'border-rose-500 focus:ring-rose-200' : 'focus:ring-emerald-200'}`}
                autoFocus
                placeholder="••••"
                maxLength={4}
                autoComplete="one-time-code"
              />
              {pinError && <p className="text-rose-500 text-sm font-bold mb-4 animate-pulse">{pinError}</p>}
              <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Confirm</button>
            </form>
            <button onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }} className="mt-4 text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

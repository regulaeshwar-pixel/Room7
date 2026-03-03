import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  Menu
} from 'lucide-react';

import ChangeLog from './views/ChangeLog';
import DashboardView from './views/DashboardView';
import ExpensesView from './views/ExpensesView';
import ScheduleView from './views/ScheduleView';
import SettingsScreen from './views/SettingsScreen';
import WaterWidget from './views/WaterWidget';

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

const HANDLER_PIN = "2929";

// --- CONSTANTS ---
const CATEGORY_GROCERIES = 'groceries';
const CATEGORY_VEGETABLES = 'vegetables';
const INITIAL_EXPECTED_AMOUNTS = {
  [CATEGORY_GROCERIES]: 1000,
  [CATEGORY_VEGETABLES]: 500,
};

// --- UTILITY FUNCTIONS ---


const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

// --- COMPONENTS ---

const NavButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? 'text-slate-900 scale-105' : 'text-slate-300 hover:text-slate-500'}`}>
    <div className={`p-1 rounded-lg transition-colors duration-300 ${active ? 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' : 'bg-transparent'}`}>{icon}</div>
    <span className={`text-[8px] uppercase tracking-[0.12em] transition-all duration-300 ${active ? 'font-black opacity-100' : 'font-semibold opacity-60'}`}>{label}</span>
  </button>
);



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

  const [isWaterLow, setIsWaterLow] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [changeLog, setChangeLog] = useState([]);
  const [roomMetadata, setRoomMetadata] = useState(null);

  const [exemptMembers, setExemptMembers] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [cookTracker, setCookTracker] = useState({ cookedMeals: 0, missedMeals: 0, startDate: new Date().toISOString() });

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
        if (data.cookTracker) setCookTracker(data.cookTracker);

        if (data.changeLog) setChangeLog(data.changeLog);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getTaskStatus = React.useCallback((taskId) => {
    if (tasks === null) return 'loading'; // New value
    const key = `${simulatedDate.toDateString()}-${taskId}`;
    return tasks[key]?.status || 'pending';
  }, [tasks, simulatedDate]);


  const triggerAlert = (msg, type = 'danger') => {
    console.log(`Alert [${type}]: ${msg}`);
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
  }, [schedule, includeCook, waterPairs, exemptMembers, members]);


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

    const memberNames = waterSelection.map(mid => members.find(m => m.id === mid)?.name).join(' & ');
    const confirmed = window.confirm(`Assign Water Duty for ${memberNames}?`);
    if (!confirmed) return;

    const newPair = {
      members: [...waterSelection],
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    addDoc(collection(db, 'rooms', ROOM_ID, 'waterPairs'), newPair);
    setWaterSelection([]);
    updateRoom({ exemptMembers: [] }); // Auto-clear exemptions on assignment

    updateRoom({}, `${currentUser.name} assigned Water Duty to ${memberNames}`);

    haptic.medium();
    triggerAlert("Water Pair Assigned", "info");
  };





  const markPairDone = (pairId) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    const pair = waterPairs.find(p => p.id === pairId); // Fetch pair to get members
    if (!pair) return;

    const path = `rooms/${ROOM_ID}/waterPairs/${String(pairId)}`;
    updateDoc(doc(db, path), { status: 'done', completedAt: new Date().toISOString(), completedBy: currentUser.name });

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

  const markCookTask = (taskId, newStatus, specificDateStr = null) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (!tasks) return;

    haptic.light();
    const key = specificDateStr ? `${specificDateStr}-${taskId}` : `${simulatedDate.toDateString()}-${taskId}`;
    const currentStatus = tasks[key]?.status;

    // Nothing changed
    if (currentStatus === newStatus) return;

    // Update task
    setDoc(doc(db, 'rooms', ROOM_ID, 'tasks', key), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    }, { merge: true });

    const niceTaskName = taskId.replace('-', ' ').toUpperCase();
    const actionStr = newStatus === 'cooked' ? 'Cooked' : newStatus === 'missed' ? 'Missed' : 'Undid';
    const msg = specificDateStr ? `${actionStr} Past ${niceTaskName} (${specificDateStr})` : `${actionStr} ${niceTaskName}`;

    updateRoom({}, msg);
    triggerAlert(`Cook Duty: ${actionStr}`, newStatus === 'missed' ? "danger" : "success");
  };

  const resetCookTracker = () => {
    if (isGuest) return;
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (currentUser.id !== vegHandlerId) { triggerAlert("Restricted. Veg Handler only.", "danger"); return; }

    const confirmed = window.confirm("Reset the cook tracker statistics back to 0?");
    if (!confirmed) return;

    const newTracker = {
      cookedMeals: 0,
      missedMeals: 0,
      startDate: new Date().toISOString()
    };

    updateRoom({ cookTracker: newTracker }, "Reset Cook Tracker stats");
    haptic.medium();
    triggerAlert("Cook Tracker Reset", "success");
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

  const addVegExpense = (amount, desc, category) => {
    if (isGuest) { triggerAlert("🔒 Guest mode — read only", "info"); return; }
    if (isReadOnly) { triggerAlert("🧊 App is temporarily frozen", "info"); return; }
    if (currentUser.id !== vegHandlerId) { triggerAlert("Restricted. Veg Handler only.", "danger"); return; }
    addDoc(collection(db, 'rooms', ROOM_ID, 'vegExpenses'), {
      amount: parseFloat(amount),
      desc,
      category: category,
      date: new Date().toISOString(),
      paidBy: currentUser.id
    });

    updateRoom({}, `Spent ${category} Fund: ${formatCurrency(amount)} (${desc})`);

    triggerAlert(`Veg Fund Expense Added (${category})`, "success");
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

  // ── Widget Route — standalone, no auth required ──────────────────────────
  if (window.location.pathname === '/widget') {
    return <WaterWidget />;
  }

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
    <div className={`max-w-md mx-auto bg-[#fafafa] h-[100dvh] relative shadow-[0_0_40px_rgba(0,0,0,0.03)] overflow-hidden font-sans text-slate-900 transition-colors duration-300 pt-[env(safe-area-inset-top)]`}>
      {/* Phase T7: Global Freeze Banner */}
      {isFrozen && (
        <div className="bg-slate-800 text-white text-xs text-center py-1.5 px-2 font-medium z-50 relative tracking-wide">
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
            isOnline={isOnline}
            isSyncing={isSyncing}
            hasPendingWrites={hasPendingWrites}
            offlineQueueCount={offlineQueueCount}
            recentlyUpdatedFields={recentlyUpdatedFields}
            exemptMembers={exemptMembers}
            toggleExemption={toggleExemption}
            cookTracker={cookTracker}
            markCookTask={markCookTask}
            resetCookTracker={resetCookTracker}
            tasks={tasks}
          />
        </div>
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar">
          <ScheduleView
            schedule={schedule}
            members={members}
            updateSchedule={updateSchedule}
            isGuest={isGuest}
            includeCook={includeCook}
            setIncludeCook={setIncludeCook}
          />
        </div>
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar bg-[#fcfcfc]">
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
          />
        </div>
        <div className="min-w-full h-full snap-start snap-always overflow-y-auto no-scrollbar bg-[#ffffff]">
          <SettingsScreen
            currentUser={currentUser}
            members={members}
            vegHandlerId={vegHandlerId}
            isGuest={isGuest}
            exemptMembers={exemptMembers}
            isFrozen={isFrozen}
            toggleFreeze={toggleFreeze}
            logout={logout}
            initiateUserSwitch={initiateUserSwitch}
            initiateHandlerToggle={initiateHandlerToggle}
            simulatedDate={simulatedDate}
            setSimulatedDate={setSimulatedDate}
            setSundayVariant={setSundayVariant}
            sundayVariant={sundayVariant}
            setMembers={setMembers}
            triggerAlert={triggerAlert}
            setCurrentUser={setCurrentUser}
          />
        </div>
      </div>


      {/* Change Log Overlay */}
      {showChangeLog && (
        <ChangeLog
          recentChanges={changeLog.slice(0, 5)}
          cookTracker={cookTracker}
          markCookTask={markCookTask}
          resetCookTracker={resetCookTracker}
          onClose={() => setShowChangeLog(false)}
        />
      )}

      {/* Remote Update Toast */}
      {lastRemoteUpdate && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs uppercase font-bold tracking-widest px-4 py-2 rounded-full shadow-lg pointer-events-none flex items-center gap-2 z-50">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          UPDATED BY {lastRemoteUpdate.by}
        </div>
      )}

      <nav className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-xl border-t border-slate-100 rounded-t-[20px] px-3 py-2 flex justify-between items-center z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <NavButton active={activeTab === 'dashboard'} onClick={() => scrollToTab('dashboard')} icon={<Menu size={18} />} label="Today" />
        <NavButton active={activeTab === 'schedule'} onClick={() => scrollToTab('schedule')} icon={<Calendar size={18} />} label="Schedule" />
        <NavButton active={activeTab === 'expenses'} onClick={() => scrollToTab('expenses')} icon={<DollarSign size={18} />} label="Expenses" />
        <NavButton active={activeTab === 'settings'} onClick={() => scrollToTab('settings')} icon={<Users size={18} />} label="Profile" />
      </nav>
      {/* Global PIN Modal - Rendered outside of tabs */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xs rounded-[28px] p-8 text-center shadow-premium">
            <h3 className="font-bold text-theme text-xl mb-2">Auth Required</h3>
            <p className="text-sm text-muted mb-6">{pinMode === 'handler' ? 'Veg handler access' : `Login as ${members.find(m => m.id === pendingTargetId)?.name}`}</p>
            <form onSubmit={confirmPin}>
              <input
                type="password"
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(""); }}
                className={`w-full text-center text-3xl font-mono text-theme p-3 border-2 rounded-xl mb-6 focus:outline-none focus:ring-4 transition-all bg-card ${pinError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50' : 'border-theme focus:border-indigo-500 focus:ring-indigo-100'}`}
                autoFocus
                placeholder="----"
                maxLength={4}
                autoComplete="one-time-code"
              />
              {pinError && <p className="text-rose-500 text-sm font-bold mb-4 animate-pulse">{pinError}</p>}
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-[16px] font-bold hover:bg-indigo-700 transition-colors shadow-lg active:scale-95">Confirm Access</button>
            </form>
            <button onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }} className="mt-4 text-xs font-bold text-muted hover:text-theme tracking-wider uppercase transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

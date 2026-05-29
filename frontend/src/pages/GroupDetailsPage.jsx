import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Copy,
  Filter,
  Pencil,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/currency';
import ReceiptScanner from '../components/transactions/ReceiptScanner';

const tabs = [
  { id: 'Overview', label: 'Overview', icon: Users },
  { id: 'Expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'Settlements', label: 'Settlements', icon: ArrowRightLeft },
  { id: 'Transactions', label: 'Transactions', icon: Wallet },
  { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
];
const splitTypeOptions = [
  { value: 'equal', label: 'Equal' },
  { value: 'exact', label: 'Exact' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'shares', label: 'Shares' },
];

const defaultExpenseForm = {
  title: '',
  amount: '',
  splitType: 'equal',
  paidByUserId: '',
  category: 'Group Expense',
  notes: '',
};

const defaultSettlementForm = { paidByUserId: '', receivedByUserId: '', amount: '', note: '' };

const GroupDetailsPage = () => {
  const { currentUser } = useAuth();
  const { groupId } = useParams();

  const [groupDetails, setGroupDetails] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [balances, setBalances] = useState([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activity, setActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('Overview');
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm);
  const [splitValues, setSplitValues] = useState({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [settlementForm, setSettlementForm] = useState(defaultSettlementForm);
  const [submittingSettleAll, setSubmittingSettleAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [analyticsPaidBy, setAnalyticsPaidBy] = useState('All');
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState('All');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('all');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(null);
  const [showExpenseSettleModal, setShowExpenseSettleModal] = useState(false);
  const [settleExpenseTarget, setSettleExpenseTarget] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNote, setSettleNote] = useState('');

  const getAuthHeaders = async () => {
    if (!currentUser?.uid) return null;
    const token = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '', 
      'x-firebase-name': currentUser.displayName || '',
    };
  };

  const memberLookup = useMemo(() => {
    const map = new Map();
    (groupDetails?.members || []).forEach((member) => {
      const id = String(member.userId);
      const email = member.emailSnapshot || '';
      const displayName = member.displayNameSnapshot || '';
      const fallback = email ? email.split('@')[0] : '';
      const safeDisplayName = displayName.includes('@') ? '' : displayName;
      const label = safeDisplayName || (fallback ? `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)}` : id);
      map.set(id, {
        id,
        label,
        email,
        role: member.role,
      });
    });
    return map;
  }, [groupDetails]);

  const memberList = useMemo(() => Array.from(memberLookup.values()), [memberLookup]);

  const currentMemberId = useMemo(() => {
    const email = String(currentUser?.email || '').toLowerCase();
    if (!email) return null;
    const match = memberList.find((member) => String(member.email || '').toLowerCase() === email);
    return match?.id || null;
  }, [memberList, currentUser?.email]);

  const selectedParticipants = useMemo(() => {
    if (!selectedParticipantIds.length) return [];
    return memberList.filter((member) => selectedParticipantIds.includes(member.id));
  }, [memberList, selectedParticipantIds]);

  const participantRows = useMemo(() => {
    return selectedParticipants.map((member) => {
      const saved = splitValues[member.id] || {};
      return {
        ...member,
        inputValue:
          expenseForm.splitType === 'exact'
            ? saved.amount ?? ''
            : expenseForm.splitType === 'percentage'
              ? saved.percent ?? ''
              : saved.shares ?? '',
      };
    });
  }, [selectedParticipants, splitValues, expenseForm.splitType]);

  const topSpender = useMemo(() => {
    const byPayer = {};
    expenses.forEach((item) => {
      const key = String(item.paidByUserId);
      byPayer[key] = (byPayer[key] || 0) + Number(item.amount || 0);
    });
    const ranked = Object.entries(byPayer).sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return null;
    const userId = ranked[0][0];
    const member = memberList.find((m) => m.id === userId);
    return { label: member?.label || userId, amount: ranked[0][1] };
  }, [expenses, memberList]);

  const monthlyTrend = useMemo(() => {
    const bucket = {};
    expenses.forEach((item) => {
      const date = new Date(item.occurredAt || item.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      bucket[key] = (bucket[key] || 0) + Number(item.amount || 0);
    });
    return Object.entries(bucket)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [expenses]);

  const categoryBlocks = useMemo(() => {
    const categories = analytics?.groupOverview?.categories || [];
    const max = Math.max(1, ...categories.map((c) => Number(c.amount || 0)));
    return categories.map((item) => ({
      ...item,
      widthPercent: Math.max(4, Math.round((Number(item.amount || 0) / max) * 100)),
    }));
  }, [analytics]);

  const avatarPalette = ['#a78bfa', '#38bdf8', '#f472b6', '#34d399', '#f59e0b', '#f97316'];
  const getAvatarTone = (seed) => {
    const index = Math.abs(String(seed || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarPalette.length;
    return avatarPalette[index];
  };
  const getInitials = (label) => {
    const safe = String(label || '').trim();
    if (!safe) return '?';
    const parts = safe.split(' ').filter(Boolean);
    return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getMemberLabel = (userId) => memberLookup.get(String(userId))?.label || String(userId).slice(-6);
  const getMemberRole = (userId) => memberLookup.get(String(userId))?.role || 'Member';
  const getMemberEmail = (userId) => memberLookup.get(String(userId))?.email || '';
  const getMyExpenseShare = (expense) => {
    if (!currentMemberId) return 0;
    const split = (expense.splits || []).find((item) => String(item.userId) === String(currentMemberId));
    return Number(split?.amount || 0);
  };
  const getMyExpenseSettled = (expense) => {
    if (!currentMemberId) return 0;
    const token = `Expense:${expense._id}`;
    return settlements
      .filter(
        (item) =>
          String(item.paidByUserId) === String(currentMemberId) &&
          String(item.receivedByUserId) === String(expense.paidByUserId) &&
          String(item.note || '').includes(token)
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  };

  const selectedCount = selectedParticipantIds.length;
  const equalSplitAmount = useMemo(() => {
    const amount = Number(expenseForm.amount || 0);
    if (selectedCount <= 0 || amount <= 0) return 0;
    return Number((amount / selectedCount).toFixed(2));
  }, [expenseForm.amount, selectedCount]);

  const memberBalances = useMemo(() => {
    const netMap = new Map();
    memberList.forEach((member) => netMap.set(member.id, 0));
    balances.forEach((row) => {
      const fromId = String(row.fromUserId);
      const toId = String(row.toUserId);
      const amount = Number(row.amount || 0);
      netMap.set(fromId, (netMap.get(fromId) || 0) - amount);
      netMap.set(toId, (netMap.get(toId) || 0) + amount);
    });
    return memberList
      .map((member) => ({
        ...member,
        net: Number((netMap.get(member.id) || 0).toFixed(2)),
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [balances, memberList]);

  const myBalance = useMemo(() => {
    if (!currentMemberId) return null;
    return memberBalances.find((member) => member.id === currentMemberId) || null;
  }, [currentMemberId, memberBalances]);

  const transactionRows = useMemo(() => {
    const rows = [];
    expenses.forEach((expense) => {
      rows.push({
        id: `expense-${expense._id}`,
        title: expense.title || 'Expense',
        subtitle: `${expense.category || 'Group Expense'} · Paid by ${getMemberLabel(expense.paidByUserId)}`,
        date: expense.occurredAt || expense.createdAt,
        amount: -Number(expense.amount || 0),
      });
    });
    settlements.forEach((settlement) => {
      rows.push({
        id: `settlement-${settlement._id}`,
        title: 'Settlement',
        subtitle: `${getMemberLabel(settlement.paidByUserId)} paid ${getMemberLabel(settlement.receivedByUserId)}`,
        date: settlement.settledAt || settlement.createdAt,
        amount: Number(settlement.amount || 0),
      });
    });
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, settlements, memberLookup]);

  const expenseCategories = useMemo(() => {
    const map = new Map();
    expenses.forEach((expense) => {
      const key = expense.category || 'Group Expense';
      map.set(key, (map.get(key) || 0) + Number(expense.amount || 0));
    });
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const analyticsExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const matchesPayer = analyticsPaidBy === 'All' || String(expense.paidByUserId) === String(analyticsPaidBy);
      const categoryKey = expense.category || 'Group Expense';
      const matchesCategory = analyticsCategoryFilter === 'All' || categoryKey === analyticsCategoryFilter;

      if (!matchesPayer || !matchesCategory) return false;
      if (analyticsTimeframe === 'all') return true;

      const expenseDate = new Date(expense.occurredAt || expense.createdAt);
      if (analyticsTimeframe === '7d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return expenseDate >= start;
      }
      if (analyticsTimeframe === '30d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return expenseDate >= start;
      }
      if (analyticsTimeframe === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return expenseDate >= start;
      }
      return true;
    });
  }, [expenses, analyticsPaidBy, analyticsCategoryFilter, analyticsTimeframe]);

  const analyticsCategoryRows = useMemo(() => {
    const grouped = new Map();
    analyticsExpenses.forEach((expense) => {
      const key = expense.category || 'Group Expense';
      grouped.set(key, (grouped.get(key) || 0) + Number(expense.amount || 0));
    });
    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(grouped.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [analyticsExpenses]);

  const analyticsTotalSpent = useMemo(
    () => analyticsExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [analyticsExpenses]
  );
  const analyticsAvgTicket = analyticsExpenses.length ? analyticsTotalSpent / analyticsExpenses.length : 0;
  const analyticsTopSpender = useMemo(() => {
    const grouped = new Map();
    analyticsExpenses.forEach((expense) => {
      const key = String(expense.paidByUserId);
      grouped.set(key, (grouped.get(key) || 0) + Number(expense.amount || 0));
    });
    const best = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!best) return null;
    return { label: getMemberLabel(best[0]), amount: best[1] };
  }, [analyticsExpenses, memberLookup]);

  const analyticsMemberRows = useMemo(() => {
    const grouped = new Map();
    analyticsExpenses.forEach((expense) => {
      const key = String(expense.paidByUserId);
      grouped.set(key, (grouped.get(key) || 0) + Number(expense.amount || 0));
    });
    return Array.from(grouped.entries())
      .map(([userId, amount]) => ({ userId, label: getMemberLabel(userId), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [analyticsExpenses, memberLookup]);

  const analyticsTimeline = useMemo(() => {
    const grouped = new Map();
    analyticsExpenses.forEach((expense) => {
      const date = new Date(expense.occurredAt || expense.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      grouped.set(key, (grouped.get(key) || 0) + Number(expense.amount || 0));
    });
    return Array.from(grouped.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
  }, [analyticsExpenses]);

  const expenseSections = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const getBucket = (date) => {
      if (date >= startOfToday) return 'Today';
      if (date >= startOfYesterday) return 'Yesterday';
      if (date >= startOfWeek) return 'This Week';
      if (date >= startOfMonth) return 'Earlier This Month';
      return 'Older';
    };

    const filtered = expenses.filter((expense) => {
      if (activeCategory === 'All') return true;
      return (expense.category || 'Group Expense') === activeCategory;
    });

    const buckets = filtered.reduce((acc, expense) => {
      const occurred = new Date(expense.occurredAt || expense.createdAt);
      const bucket = getBucket(occurred);
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(expense);
      return acc;
    }, {});

    const order = ['Today', 'Yesterday', 'This Week', 'Earlier This Month', 'Older'];
    return order
      .filter((label) => buckets[label]?.length)
      .map((label) => ({
        label,
        items: buckets[label].sort((a, b) => new Date(b.occurredAt || b.createdAt) - new Date(a.occurredAt || a.createdAt)),
      }));
  }, [expenses, activeCategory]);

  const settlementCards = useMemo(() => {
    return simplifiedDebts.map((item) => {
      const fromId = String(item.fromUserId);
      const toId = String(item.toUserId);
      const isYouPaying = currentMemberId && fromId === String(currentMemberId);
      const isYouReceiving = currentMemberId && toId === String(currentMemberId);
      const status = isYouPaying ? 'you-owe' : isYouReceiving ? 'you-receive' : 'neutral';
      return {
        id: `${fromId}-${toId}-${item.amount}`,
        fromId,
        toId,
        amount: Number(item.amount || 0),
        status,
      };
    });
  }, [simplifiedDebts, currentMemberId]);

  const activityTimeline = useMemo(() => {
    const items = activity.map((item) => ({
      id: item._id,
      type: item.type,
      title: item.title,
      description: item.description,
      date: item.createdAt,
      actorId: item.actorUserId,
    }));

    if (items.length) {
      return items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const fallback = [];
    expenses.forEach((expense) => {
      fallback.push({
        id: `expense-${expense._id}`,
        type: 'expense_added',
        title: `${getMemberLabel(expense.createdByUserId)} added ${expense.title}`,
        description: `Paid by ${getMemberLabel(expense.paidByUserId)} · ${formatCurrency(expense.amount, 'INR')}`,
        date: expense.createdAt,
        actorId: expense.createdByUserId,
      });
    });
    settlements.forEach((settlement) => {
      fallback.push({
        id: `settlement-${settlement._id}`,
        type: 'settlement_added',
        title: `${getMemberLabel(settlement.paidByUserId)} settled up`,
        description: `${formatCurrency(settlement.amount, 'INR')} with ${getMemberLabel(settlement.receivedByUserId)}`,
        date: settlement.createdAt,
        actorId: settlement.paidByUserId,
      });
    });
    return fallback.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activity, expenses, settlements, memberLookup]);

  const contributionRows = useMemo(() => {
    const map = new Map();
    expenses.forEach((expense) => {
      const key = String(expense.paidByUserId);
      map.set(key, (map.get(key) || 0) + Number(expense.amount || 0));
    });
    return Array.from(map.entries())
      .map(([userId, total]) => ({
        userId,
        label: getMemberLabel(userId),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses, memberLookup]);

  const mostActiveMember = useMemo(() => {
    if (activity.length) {
      const countMap = new Map();
      activity.forEach((item) => {
        const key = String(item.actorUserId || '');
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });
      const ranked = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]);
      if (ranked.length) return getMemberLabel(ranked[0][0]);
    }
    return contributionRows[0]?.label || 'N/A';
  }, [activity, contributionRows, memberLookup]);

  const settlementCompletionRate = useMemo(() => {
    if (!expenses.length) return 0;
    const settledCount = expenses.filter((expense) => expense.settlementStatus === 'settled').length;
    return Math.round((settledCount / expenses.length) * 100);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    const grouped = {};
    expenses.forEach((expense) => {
      const key = expense.category || 'Group Expense';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(expense);
    });
    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => new Date(b.occurredAt || b.createdAt) - new Date(a.occurredAt || a.createdAt)),
      total: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }));
  }, [expenses]);

  const loadGroupModule = async () => {
    if (!groupId || !currentUser?.uid) return;
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const [
        detailRes,
        analyticsRes,
        balancesRes,
        simplifiedRes,
        expensesRes,
        settlementsRes,
        activityRes,
        notificationsRes,
      ] = await Promise.all([
        api.get(`/api/groups/${groupId}`, { headers }),
        api.get(`/api/groups/${groupId}/analytics`, { headers }),
        api.get(`/api/groups/${groupId}/balances`, { headers }),
        api.get(`/api/groups/${groupId}/debts/simplified`, { headers }),
        api.get(`/api/groups/${groupId}/expenses`, { headers }),
        api.get(`/api/groups/${groupId}/settlements`, { headers }),
        api.get(`/api/groups/${groupId}/activity`, { headers }),
        api.get(`/api/groups/${groupId}/notifications`, { headers }),
      ]);

      const nextGroup = detailRes.data?.group || null;
      setGroupDetails(nextGroup);
      setAnalytics(analyticsRes.data || null);
      setBalances(balancesRes.data?.balances || []);
      setSimplifiedDebts(simplifiedRes.data?.simplified || []);
      setExpenses(expensesRes.data?.expenses || []);
      setSettlements(settlementsRes.data?.settlements || []);
      setActivity(activityRes.data?.activity || []);
      setNotifications(notificationsRes.data?.notifications || []);

      if (nextGroup?.members?.length) {
        const firstMemberId = String(nextGroup.members[0].userId);
        setExpenseForm((prev) => ({ ...prev, paidByUserId: prev.paidByUserId || firstMemberId }));
        setSettlementForm((prev) => ({
          ...prev,
          paidByUserId: prev.paidByUserId || firstMemberId,
          receivedByUserId: prev.receivedByUserId || firstMemberId,
        }));
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load group workspace.');
      setGroupDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupModule();
  }, [groupId, currentUser?.uid]);

  useEffect(() => {
    if (memberList.length && selectedParticipantIds.length === 0) {
      setSelectedParticipantIds(memberList.map((member) => member.id));
    }
  }, [memberList, selectedParticipantIds.length]);

  const onScannerAdd = async ({ amount, category, notes }) => {
    setExpenseForm((prev) => ({
      ...prev,
      amount: String(amount || ''),
      category: category || prev.category,
      notes: notes || prev.notes,
      title: prev.title || 'Scanned Group Expense',
    }));
  };

  const openCreateExpense = () => {
    setEditingExpenseId('');
    setExpenseForm(defaultExpenseForm);
    setSplitValues({});
    setSelectedParticipantIds(memberList.map((member) => member.id));
    setShowScanner(false);
    setShowExpenseModal(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setExpenseForm({
      title: expense.title || '',
      amount: String(expense.amount || ''),
      splitType: expense.splitType || 'equal',
      paidByUserId: String(expense.paidByUserId || ''),
      category: expense.category || 'Group Expense',
      notes: expense.notes || '',
    });
    const nextSplitValues = {};
    (expense.splits || []).forEach((split) => {
      nextSplitValues[String(split.userId)] = {
        amount: split.amount ?? '',
        percent: split.percent ?? '',
        shares: split.shares ?? '',
      };
    });
    const participantIds = (expense.participantUserIds || []).map((id) => String(id));
    setSelectedParticipantIds(participantIds.length ? participantIds : memberList.map((member) => member.id));
    setSplitValues(nextSplitValues);
    setShowScanner(false);
    setShowExpenseModal(true);
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    if (!groupId) return;
    try {
      const trimmedTitle = String(expenseForm.title || '').trim();
      const payerId = expenseForm.paidByUserId || currentMemberId || '';
      if (!trimmedTitle) {
        setError('Please add a title for the expense.');
        return;
      }
      if (!payerId) {
        setError('Please select who paid for this expense.');
        return;
      }
      if (!selectedParticipantIds.length) {
        setError('Select at least one participant to split with.');
        return;
      }
      const headers = await getAuthHeaders();
      if (!headers) return;
      const splitInputs = selectedParticipants.map((member) => ({
        userId: member.id,
        amount: Number(splitValues[member.id]?.amount || 0),
        percent: Number(splitValues[member.id]?.percent || 0),
        shares: Number(splitValues[member.id]?.shares || 0),
      }));

      const payload = {
        ...expenseForm,
        title: trimmedTitle,
        paidByUserId: payerId,
        amount: Number(expenseForm.amount),
        participantUserIds: selectedParticipantIds,
        splitInputs,
      };

      if (editingExpenseId) {
        await api.put(`/api/groups/${groupId}/expenses/${editingExpenseId}`, payload, { headers });
      } else {
        await api.post(`/api/groups/${groupId}/expenses`, payload, { headers });
      }
      setShowExpenseModal(false);
      await loadGroupModule();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to save expense.');
    }
  };

  const deleteExpense = async () => {
    if (!confirmDeleteExpense) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await api.delete(`/api/groups/${groupId}/expenses/${confirmDeleteExpense._id}`, { headers });
      setConfirmDeleteExpense(null);
      setSelectedExpense(null);
      await loadGroupModule();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to delete expense.');
    }
  };

  const settlePayment = async (event) => {
    event.preventDefault();
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await api.post(
        `/api/groups/${groupId}/settlements`,
        {
          ...settlementForm,
          amount: Number(settlementForm.amount),
        },
        { headers }
      );
      setSettlementForm((prev) => ({ ...prev, amount: '', note: '' }));
      setShowSettlementModal(false);
      await loadGroupModule();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to record settlement.');
    }
  };

  const toggleParticipant = (memberId) => {
    setSelectedParticipantIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const openExpenseSettlement = (expense) => {
    if (!currentMemberId || String(expense.paidByUserId) === String(currentMemberId)) return;
    const share = getMyExpenseShare(expense);
    if (share <= 0) return;
    const settled = getMyExpenseSettled(expense);
    const remaining = Math.max(0, Number((share - settled).toFixed(2)));
    setSettleExpenseTarget(expense);
    setSettleAmount(String(remaining > 0 ? remaining : share));
    setSettleNote(`Expense:${expense._id}`);
    setShowExpenseSettleModal(true);
  };

  const submitExpenseSettlement = async (event) => {
    event.preventDefault();
    if (!settleExpenseTarget || !currentMemberId) return;
    const share = getMyExpenseShare(settleExpenseTarget);
    const settled = getMyExpenseSettled(settleExpenseTarget);
    const remaining = Math.max(0, Number((share - settled).toFixed(2)));
    const amountValue = Number(settleAmount || 0);
    if (remaining <= 0) {
      setError('This expense is already settled for you.');
      return;
    }
    if (amountValue <= 0 || amountValue > remaining) {
      setError('Enter a valid settlement amount.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await api.post(
        `/api/groups/${groupId}/settlements`,
        {
          paidByUserId: String(currentMemberId),
          receivedByUserId: String(settleExpenseTarget.paidByUserId),
          amount: amountValue,
          note: settleNote || `Expense:${settleExpenseTarget._id}`,
        },
        { headers }
      );
      setShowExpenseSettleModal(false);
      setSettleExpenseTarget(null);
      setSettleAmount('');
      setSettleNote('');
      await loadGroupModule();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to settle this expense.');
    }
  };

  const settleAllSuggested = async () => {
    if (!simplifiedDebts.length || submittingSettleAll) return;
    setSubmittingSettleAll(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      for (const item of simplifiedDebts) {
        await api.post(
          `/api/groups/${groupId}/settlements`,
          {
            paidByUserId: String(item.fromUserId),
            receivedByUserId: String(item.toUserId),
            amount: Number(item.amount),
            note: 'One-click optimized settlement',
          },
          { headers }
        );
      }
      await loadGroupModule();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to settle all suggested debts.');
    } finally {
      setSubmittingSettleAll(false);
    }
  };

  const openSuggestedSettlement = (item) => {
    setSettlementForm({
      paidByUserId: String(item.fromUserId),
      receivedByUserId: String(item.toUserId),
      amount: String(item.amount || ''),
      note: 'Suggested settlement',
    });
    setShowSettlementModal(true);
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await api.put(`/api/groups/notifications/${notificationId}/read`, {}, { headers });
      setNotifications((current) => current.map((item) => (item._id === notificationId ? { ...item, read: true } : item)));
    } catch (_error) {
      // ignore
    }
  };

  const copyInviteCode = async () => {
    if (!groupDetails?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(groupDetails.inviteCode);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (_error) {
      setInviteCopied(false);
    }
  };

  return (
    <section className="groups-page-premium">
      <header className="group-workspace-hero">
        <div className="group-hero-left split-detail-left">
          <Link to="/groups" className="group-hero-back split-back-button"><ChevronLeft size={16} /></Link>
          <div className="group-hero-title">
            <h1>{groupDetails?.name || 'Group Workspace'}</h1>
          </div>
        </div>
        <div className="group-hero-actions split-detail-actions">
          <button type="button" className="group-invite-card split-invite-card" onClick={copyInviteCode}>
            <span>Invite Code</span>
            <strong>{groupDetails?.inviteCode || '------'}</strong>
            <Copy size={18} />
          </button>
          {inviteCopied && <span className="group-hero-toast">Invite code copied</span>}
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {loading && <p className="dashboard-loading">Loading group workspace...</p>}

      {groupDetails && (
        <>
          <section className="group-summary-strip split-overview-strip">
            <article>
              <span><Users size={14} /> Members</span>
              <strong>{groupDetails?.members?.length || 0}</strong>
              <small>People in this group</small>
            </article>
            <article>
              <span><ReceiptText size={14} /> Expenses</span>
              <strong>{analytics?.groupOverview?.expenseCount || expenses.length}</strong>
              <small>Expenses logged</small>
            </article>
            <article>
              <span><Wallet size={14} /> Total Spent</span>
              <strong>{formatCurrency(analytics?.groupOverview?.totalSpent || 0, 'INR')}</strong>
              <small>Across all members</small>
            </article>
          </section>

          <nav className="group-tabs-segmented">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`group-tab-pill ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === 'Overview' && (
            <div className="group-tab-grid split-overview-grid">
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3><Users size={15} /> Members</h3>
                  <span className="group-panel-meta">Net balance by member</span>
                </div>
                <div className="group-member-list">
                  {memberBalances.map((member) => (
                    <div key={member.id} className="group-member-row">
                      <div className="group-member-info">
                        <span className="group-member-avatar" style={{ '--avatar-tone': getAvatarTone(member.id) }}>
                          {getInitials(member.label)}
                        </span>
                        <div>
                          <strong>{member.label}</strong>
                          <small>{member.role || 'Member'}</small>
                        </div>
                      </div>
                      <div className="group-member-meta">
                        <div className="group-member-tags">
                          {currentMemberId === member.id && <span className="group-tag">You</span>}
                          {member.role && <span className="group-tag group-tag-muted">{member.role}</span>}
                        </div>
                        <div className={`group-member-balance ${member.net >= 0 ? 'is-positive' : 'is-negative'}`}>
                          {formatCurrency(member.net, 'INR')}
                          <span>Net Balance</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!memberBalances.length && <p className="groups-empty-state">No members found.</p>}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'Expenses' && (
            <div className="group-panel">
              <div className="group-panel-head">
                <h3><ReceiptText size={15} /> Expenses</h3>
                <button type="button" className="groups-cta" onClick={openCreateExpense}><Plus size={14} /> Add Expense</button>
              </div>
              <div className="group-expense-filters">
                <button
                  type="button"
                  className={`group-filter-chip ${activeCategory === 'All' ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory('All')}
                >
                  All ({expenses.length})
                </button>
                {expenseCategories.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    className={`group-filter-chip ${activeCategory === item.category ? 'is-active' : ''}`}
                    onClick={() => setActiveCategory(item.category)}
                  >
                    {item.category} ({item.total ? formatCurrency(item.total, 'INR') : '0'})
                  </button>
                ))}
              </div>
              <div className="group-expense-list">
                {expenseSections.map((section) => (
                  <div key={section.label} className="group-expense-section">
                    <div className="group-expense-section-head">
                      <h4>{section.label}</h4>
                      <small>{section.items.length} expenses</small>
                    </div>
                    <div className="group-expense-stack">
                      {section.items.map((expense) => (
                        <button key={expense._id} type="button" className="group-expense-card" onClick={() => setSelectedExpense(expense)}>
                    {(() => {
                      const myShare = getMyExpenseShare(expense);
                      const mySettled = getMyExpenseSettled(expense);
                      const myRemaining = Math.max(0, Number((myShare - mySettled).toFixed(2)));
                      const showMySettle =
                        currentMemberId &&
                        String(expense.paidByUserId) !== String(currentMemberId) &&
                        myShare > 0;
                      const youPaid = currentMemberId && String(expense.paidByUserId) === String(currentMemberId);
                      const settledLabel = expense.settlementStatus || 'pending';
                      const statusTone = settledLabel === 'settled' ? 'is-settled' : settledLabel === 'partial' ? 'is-partial' : 'is-pending';

                      return (
                        <>
                            <div className="group-expense-main">
                              <div className="group-expense-title">
                                <strong>{expense.title}</strong>
                                <small>
                                  {youPaid ? 'You paid' : `Paid by ${getMemberLabel(expense.paidByUserId)}`} · Added by {getMemberLabel(expense.createdByUserId)} ·{' '}
                                  {new Date(expense.occurredAt || expense.createdAt).toLocaleDateString()}
                                </small>
                              </div>
                              <div className="group-expense-meta-row">
                                <div className="group-expense-tags">
                                  <span className={`group-chip group-chip-muted ${youPaid ? 'is-highlight' : ''}`}>{expense.category || 'Group Expense'}</span>
                                  <span className="group-chip group-chip-muted">{expense.splitType} split</span>
                                  <span className={`group-chip group-chip-status ${statusTone}`}>{settledLabel}</span>
                                </div>
                                <div className="group-expense-amount">
                                  {formatCurrency(expense.amount, 'INR')}
                                </div>
                              </div>
                              <div className="group-expense-splits">
                                <span>Split with</span>
                                <div className="group-split-tags">
                                  {(expense.splits || []).length > 0 ? (
                                    expense.splits.map((split) => (
                                      <span key={`${expense._id}-${split.userId}`} className="group-split-tag">
                                        {getMemberLabel(split.userId)} {formatCurrency(split.amount, 'INR')}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="group-split-tag">Split equally</span>
                                  )}
                                </div>
                              </div>
                              {currentMemberId && (
                                <div className="group-expense-status">
                                  <div>
                                    <span>Your share</span>
                                    <strong>{formatCurrency(myShare, 'INR')}</strong>
                                  </div>
                                  <div>
                                    <span>Settled</span>
                                    <strong>{formatCurrency(mySettled, 'INR')}</strong>
                                  </div>
                                  <div>
                                    <span>Remaining</span>
                                    <strong>{formatCurrency(myRemaining, 'INR')}</strong>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="group-expense-actions">
                              {showMySettle && (
                                <button
                                  type="button"
                                  className="groups-cta group-expense-settle"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openExpenseSettlement(expense);
                                  }}
                                >
                                  {myRemaining > 0 ? 'Settle' : 'Settled'}
                                </button>
                              )}
                              <span className="group-inline-actions">
                                <Pencil size={13} onClick={(e) => { e.stopPropagation(); openEditExpense(expense); }} />
                                <Trash2 size={13} onClick={(e) => { e.stopPropagation(); setConfirmDeleteExpense(expense); }} />
                              </span>
                            </div>
                        </>
                      );
                    })()}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!expenses.length && <p className="groups-empty-state">No expenses added yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Settlements' && (
            <div className="group-tab-grid">
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3><ArrowRightLeft size={15} /> Who owes whom</h3>
                  <span className="group-panel-meta">Optimized relationships</span>
                </div>
                <div className="group-settlement-grid">
                  {settlementCards.map((card) => (
                    <div key={card.id} className={`group-settlement-card ${card.status}`}>
                      <div className="group-settlement-party">
                        <span className="group-member-avatar" style={{ '--avatar-tone': getAvatarTone(card.fromId) }}>{getInitials(getMemberLabel(card.fromId))}</span>
                        <div>
                          <strong>{getMemberLabel(card.fromId)}</strong>
                          <small>Pays</small>
                        </div>
                      </div>
                      <div className="group-settlement-amount">
                        <span>→</span>
                        <strong>{formatCurrency(card.amount, 'INR')}</strong>
                      </div>
                      <div className="group-settlement-party">
                        <span className="group-member-avatar" style={{ '--avatar-tone': getAvatarTone(card.toId) }}>{getInitials(getMemberLabel(card.toId))}</span>
                        <div>
                          <strong>{getMemberLabel(card.toId)}</strong>
                          <small>Receives</small>
                        </div>
                      </div>
                      <div className="group-settlement-actions">
                        <button
                          type="button"
                          className="groups-cta"
                          onClick={() =>
                            openSuggestedSettlement({
                              fromUserId: card.fromId,
                              toUserId: card.toId,
                              amount: card.amount,
                            })
                          }
                        >
                          Settle Now
                        </button>
                        <button type="button" className="groups-cta groups-cta-ghost" disabled>
                          Remind
                        </button>
                      </div>
                    </div>
                  ))}
                  {!settlementCards.length && (
                    <div className="groups-empty-state group-empty-card">
                      <p>No settlements needed right now.</p>
                      <small>When expenses are added, suggestions will appear here.</small>
                    </div>
                  )}
                </div>
                <div className="group-settle-toolbar">
                  <button type="button" className="groups-cta" disabled={!simplifiedDebts.length || submittingSettleAll} onClick={settleAllSuggested}>
                    {submittingSettleAll ? 'Settling...' : 'Settle all'}
                  </button>
                  <span className="group-panel-meta">Minimizes number of transactions</span>
                </div>
              </article>
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3>Settlement Ledger</h3>
                  <span className="group-panel-meta">Verified payments</span>
                </div>
                <div className="group-ledger-list">
                  {settlements.map((item) => (
                    <div key={item._id} className="group-ledger-row">
                      <div className="group-ledger-main">
                        <strong>{getMemberLabel(item.paidByUserId)} paid {getMemberLabel(item.receivedByUserId)}</strong>
                        <small>{new Date(item.settledAt || item.createdAt).toLocaleString()}</small>
                      </div>
                      <div className="group-ledger-amount">
                        <CheckCircle2 size={14} /> {formatCurrency(item.amount, 'INR')}
                      </div>
                    </div>
                  ))}
                  {!settlements.length && <p className="groups-empty-state">No settlements recorded yet.</p>}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div className="group-tab-grid">
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3>Activity Timeline</h3>
                  <span className="group-panel-meta">Shared finance events</span>
                </div>
                <div className="group-timeline">
                  {activityTimeline.map((item) => (
                    <div key={item.id} className="group-timeline-row">
                      <div className="group-timeline-icon">
                        {item.type?.includes('expense') ? <ReceiptText size={14} /> : item.type?.includes('settlement') ? <ArrowRightLeft size={14} /> : <Sparkles size={14} />}
                      </div>
                      <div className="group-timeline-content">
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </div>
                      <div className="group-timeline-meta">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span className="group-timeline-actor">{getMemberLabel(item.actorId)}</span>
                      </div>
                    </div>
                  ))}
                  {!activityTimeline.length && (
                    <div className="groups-empty-state group-empty-card">
                      <p>No activity yet.</p>
                      <small>Add your first expense to start the group timeline.</small>
                    </div>
                  )}
                </div>
              </article>
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3><Bell size={15} /> Notifications</h3>
                  <span className="group-panel-meta">Group alerts</span>
                </div>
                <div className="group-notification-list">
                  {notifications.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className={`group-notification-card ${item.read ? '' : 'is-unread'}`}
                      onClick={() => markNotificationRead(item._id)}
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.description || 'Group update'}</small>
                      </div>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </button>
                  ))}
                  {!notifications.length && (
                    <div className="groups-empty-state group-empty-card">
                      <p>No notifications yet.</p>
                      <small>Reminders and settlement alerts will show here.</small>
                    </div>
                  )}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="group-analytics-layout">
              <article className="group-panel group-analytics-filters">
                <div className="group-panel-head">
                  <h3><Filter size={15} /> Analytics Filters</h3>
                  <span className="group-panel-meta">Adjust your view of the group finances</span>
                </div>
                <div className="group-analytics-filter-grid">
                  <label>
                    <span><Users size={13} /> Paid By</span>
                    <select value={analyticsPaidBy} onChange={(event) => setAnalyticsPaidBy(event.target.value)}>
                      <option value="All">All Members</option>
                      {memberList.map((member) => (
                        <option key={member.id} value={member.id}>{member.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span><Clock3 size={13} /> Category</span>
                    <select value={analyticsCategoryFilter} onChange={(event) => setAnalyticsCategoryFilter(event.target.value)}>
                      <option value="All">All Categories</option>
                      {expenseCategories.map((item) => (
                        <option key={item.category} value={item.category}>{item.category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span><TrendingUp size={13} /> Timeframe</span>
                    <select value={analyticsTimeframe} onChange={(event) => setAnalyticsTimeframe(event.target.value)}>
                      <option value="all">All Time</option>
                      <option value="month">This Month</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="7d">Last 7 Days</option>
                    </select>
                  </label>
                </div>
              </article>

              <div className="group-analytics-kpis">
                <article className="group-panel group-analytics-kpi">
                  <span>TOTAL VOLUME</span>
                  <strong>{formatCurrency(analyticsTotalSpent, 'INR')}</strong>
                  <small>{analyticsExpenses.length} transactions</small>
                  <CircleDollarSign size={34} />
                </article>
                <article className="group-panel group-analytics-kpi">
                  <span>AVG. TICKET</span>
                  <strong>{formatCurrency(analyticsAvgTicket, 'INR')}</strong>
                  <small>Value per expense</small>
                  <TrendingUp size={34} />
                </article>
                <article className="group-panel group-analytics-kpi">
                  <span>TOP SPENDER</span>
                  <strong>{analyticsTopSpender?.label || 'N/A'}</strong>
                  <small>Active in this view</small>
                  <UserRound size={34} />
                </article>
              </div>

              <div className="group-analytics-main-grid">
                <article className="group-panel">
                  <div className="group-panel-head">
                    <h3>Category Distribution</h3>
                    <span className="group-panel-meta">{analyticsCategoryRows.length} Categories</span>
                  </div>
                  <div className="group-analytics-donut-wrap">
                    <div
                      className="group-analytics-donut"
                      style={{
                        background: analyticsCategoryRows.length
                          ? `conic-gradient(${analyticsCategoryRows.map((item, index) => {
                              const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
                              const start = analyticsCategoryRows.slice(0, index).reduce((sum, row) => sum + row.percent, 0);
                              const end = start + item.percent;
                              return `${colors[index % colors.length]} ${start}% ${end}%`;
                            }).join(', ')})`
                          : 'conic-gradient(#e5e7eb 0% 100%)',
                      }}
                    >
                      <div className="group-analytics-donut-hole" />
                    </div>
                  </div>
                </article>

                <article className="group-panel">
                  <div className="group-panel-head">
                    <h3>Spending Breakdown</h3>
                    <span className="group-panel-meta">By category</span>
                  </div>
                  <div className="group-analytics-breakdown">
                    {analyticsCategoryRows.map((row, index) => {
                      const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
                      return (
                        <div key={row.category} className="group-analytics-break-row">
                          <div className="group-analytics-break-head">
                            <span><i style={{ background: colors[index % colors.length] }} />{row.category}</span>
                            <strong>{formatCurrency(row.amount, 'INR')}</strong>
                          </div>
                          <div className="group-analytics-progress">
                            <span style={{ width: `${Math.max(4, row.percent)}%`, background: colors[index % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                    {!analyticsCategoryRows.length && <p className="groups-empty-state">No category data yet.</p>}
                  </div>
                </article>
              </div>

              <div className="group-analytics-bottom-grid">
                <article className="group-panel">
                  <div className="group-panel-head">
                    <h3>Expense by Member</h3>
                    <span className="group-panel-meta">Contribution spread</span>
                  </div>
                  <div className="group-analytics-member-bars">
                    {analyticsMemberRows.map((row) => {
                      const max = Math.max(1, ...analyticsMemberRows.map((item) => item.amount));
                      const height = Math.max(10, Math.round((row.amount / max) * 100));
                      return (
                        <div key={row.userId} className="group-analytics-member-col">
                          <div className="group-analytics-member-track">
                            <span style={{ height: `${height}%` }} />
                          </div>
                          <strong>{row.label}</strong>
                        </div>
                      );
                    })}
                    {!analyticsMemberRows.length && <p className="groups-empty-state">No member expense data.</p>}
                  </div>
                </article>
                <article className="group-panel">
                  <div className="group-panel-head">
                    <h3>Timeline</h3>
                    <span className="group-panel-meta">Recent trend</span>
                  </div>
                  <div className="group-analytics-timeline">
                    {analyticsTimeline.map((row) => (
                      <div key={row.date} className="group-analytics-time-row">
                        <span>{new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <strong>{formatCurrency(row.amount, 'INR')}</strong>
                      </div>
                    ))}
                    {!analyticsTimeline.length && <p className="groups-empty-state">No timeline data yet.</p>}
                  </div>
                </article>
              </div>
            </div>
          )}
        </>
      )}

      {showExpenseModal && (
        <div className="groups-modal-backdrop">
          <div className="groups-modal-card">
            <div className="groups-modal-head">
              <h3>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button type="button" onClick={() => setShowExpenseModal(false)}><X size={14} /></button>
            </div>
            <form className="group-form-grid" onSubmit={submitExpense}>
              <input placeholder="Title" value={expenseForm.title} onChange={(e) => setExpenseForm((p) => ({ ...p, title: e.target.value }))} />
              <input type="number" min="0" step="0.01" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
              <select value={expenseForm.splitType} onChange={(e) => setExpenseForm((p) => ({ ...p, splitType: e.target.value }))}>
                {splitTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={expenseForm.paidByUserId} onChange={(e) => setExpenseForm((p) => ({ ...p, paidByUserId: e.target.value }))}>
                <option value="">Paid by</option>
                {memberList.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
              </select>
              <input placeholder="Category" value={expenseForm.category} onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))} />
              <input placeholder="Notes" value={expenseForm.notes} onChange={(e) => setExpenseForm((p) => ({ ...p, notes: e.target.value }))} />
              <div className="group-split-select">
                <div className="group-split-select-head">
                  <span>Split with</span>
                  <span>{selectedCount} selected • {formatCurrency(equalSplitAmount, 'INR')} per person</span>
                </div>
                <div className="group-split-card-grid">
                  {memberList.map((member) => {
                    const isSelected = selectedParticipantIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        className={`group-split-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => toggleParticipant(member.id)}
                      >
                        <span className="group-split-avatar">{member.label.slice(0, 1).toUpperCase()}</span>
                        <div>
                          <strong>{member.label}</strong>
                          <small>{member.role || 'Member'}</small>
                        </div>
                        {isSelected && expenseForm.splitType === 'equal' && (
                          <span className="group-split-amount">{formatCurrency(equalSplitAmount, 'INR')}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="button" className="groups-cta groups-cta-ghost" onClick={() => setShowScanner((v) => !v)}>
                {showScanner ? 'Hide Receipt Scanner' : 'Scan Receipt'}
              </button>
              {showScanner && <ReceiptScanner onClose={() => setShowScanner(false)} onAdd={onScannerAdd} />}

              {expenseForm.splitType !== 'equal' && (
                <div className="group-split-box">
                  {participantRows.map((row) => (
                    <label key={row.id}>
                      <span>{row.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={expenseForm.splitType === 'exact' ? 'Amount' : expenseForm.splitType === 'percentage' ? 'Percent' : 'Shares'}
                        value={row.inputValue}
                        onChange={(event) =>
                          setSplitValues((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...prev[row.id],
                              [expenseForm.splitType === 'exact' ? 'amount' : expenseForm.splitType === 'percentage' ? 'percent' : 'shares']:
                                event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
              <button type="submit" className="groups-cta">{editingExpenseId ? 'Update Expense' : 'Add Expense'}</button>
            </form>
          </div>
        </div>
      )}

      {showSettlementModal && (
        <div className="groups-modal-backdrop">
          <div className="groups-modal-card">
            <div className="groups-modal-head">
              <h3>Record Settlement</h3>
              <button type="button" onClick={() => setShowSettlementModal(false)}><X size={14} /></button>
            </div>
            <form className="group-form-grid" onSubmit={settlePayment}>
              <select value={settlementForm.paidByUserId} onChange={(e) => setSettlementForm((p) => ({ ...p, paidByUserId: e.target.value }))}>
                <option value="">Paid by</option>
                {memberList.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
              </select>
              <select value={settlementForm.receivedByUserId} onChange={(e) => setSettlementForm((p) => ({ ...p, receivedByUserId: e.target.value }))}>
                <option value="">Received by</option>
                {memberList.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
              </select>
              <input type="number" min="0" step="0.01" placeholder="Amount" value={settlementForm.amount} onChange={(e) => setSettlementForm((p) => ({ ...p, amount: e.target.value }))} />
              <input placeholder="Note" value={settlementForm.note} onChange={(e) => setSettlementForm((p) => ({ ...p, note: e.target.value }))} />
              <button type="submit" className="groups-cta">Save Settlement</button>
            </form>
          </div>
        </div>
      )}

      {showExpenseSettleModal && settleExpenseTarget && (
        <div className="groups-modal-backdrop">
          <div className="groups-modal-card">
            <div className="groups-modal-head">
              <h3>Settle your share</h3>
              <button type="button" onClick={() => setShowExpenseSettleModal(false)}><X size={14} /></button>
            </div>
            <div className="group-settle-summary">
              <p>{getMemberLabel(currentMemberId)} → {getMemberLabel(settleExpenseTarget.paidByUserId)}</p>
              <small>{settleExpenseTarget.title || 'Expense'} · {new Date(settleExpenseTarget.occurredAt || settleExpenseTarget.createdAt).toLocaleDateString()}</small>
            </div>
            <form className="group-form-grid" onSubmit={submitExpenseSettlement}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Settlement amount"
                value={settleAmount}
                onChange={(event) => setSettleAmount(event.target.value)}
              />
              <input
                placeholder="Note (optional)"
                value={settleNote}
                onChange={(event) => setSettleNote(event.target.value)}
              />
              <button type="submit" className="groups-cta">Confirm Settlement</button>
            </form>
          </div>
        </div>
      )}

      {selectedExpense && (
        <div className="groups-modal-backdrop">
          <div className="groups-modal-card groups-drawer-card">
            <div className="groups-modal-head">
              <h3>{selectedExpense.title}</h3>
              <button type="button" onClick={() => setSelectedExpense(null)}><X size={14} /></button>
            </div>
            <div className="group-feed">
              <div className="group-feed-item"><span>Category</span><strong>{selectedExpense.category || 'Group Expense'}</strong></div>
              <div className="group-feed-item"><span>Amount</span><strong>{formatCurrency(selectedExpense.amount, 'INR')}</strong></div>
              <div className="group-feed-item"><span>Paid by</span><strong>{getMemberLabel(selectedExpense.paidByUserId)}</strong></div>
              <div className="group-feed-item"><span>Added by</span><strong>{getMemberLabel(selectedExpense.createdByUserId)}</strong></div>
              <div className="group-feed-item"><span>Date</span><strong>{new Date(selectedExpense.occurredAt || selectedExpense.createdAt).toLocaleString()}</strong></div>
              <div className="group-feed-item"><span>Split Type</span><strong>{selectedExpense.splitType}</strong></div>
              <div className="group-feed-item"><span>Notes</span><strong>{selectedExpense.notes || 'No notes'}</strong></div>
              {currentMemberId && (
                <div className="group-feed-item">
                  <span>Your share</span>
                  <strong>{formatCurrency(getMyExpenseShare(selectedExpense), 'INR')}</strong>
                </div>
              )}
              {currentMemberId && (
                <div className="group-feed-item">
                  <span>Settled so far</span>
                  <strong>{formatCurrency(getMyExpenseSettled(selectedExpense), 'INR')}</strong>
                </div>
              )}
              <div className="group-split-detail">
                <span>Split details</span>
                <div className="group-split-tags">
                  {(selectedExpense.splits || []).length > 0 ? (
                    selectedExpense.splits.map((split) => (
                      <span key={`${selectedExpense._id}-detail-${split.userId}`} className="group-split-tag">
                        {getMemberLabel(split.userId)} {formatCurrency(split.amount, 'INR')}
                      </span>
                    ))
                  ) : (
                    <span className="group-split-tag">Split equally</span>
                  )}
                </div>
              </div>
              {selectedExpense.receiptImageUrl && (
                <div className="group-receipt-preview">
                  <img src={selectedExpense.receiptImageUrl} alt="Receipt preview" />
                </div>
              )}
              {selectedExpense.receiptScan && (
                <pre className="group-receipt-json">{JSON.stringify(selectedExpense.receiptScan, null, 2)}</pre>
              )}
            </div>
            <div className="groups-hero-actions">
              <button type="button" className="groups-cta groups-cta-ghost" onClick={() => openEditExpense(selectedExpense)}><Pencil size={14} /> Edit</button>
              <button type="button" className="groups-cta" onClick={() => setConfirmDeleteExpense(selectedExpense)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteExpense && (
        <div className="groups-modal-backdrop">
          <div className="groups-modal-card">
            <div className="groups-modal-head">
              <h3>Delete Expense</h3>
              <button type="button" onClick={() => setConfirmDeleteExpense(null)}><X size={14} /></button>
            </div>
            <p className="groups-empty-state">Delete "{confirmDeleteExpense.title}" and recalculate balances?</p>
            <div className="groups-hero-actions">
              <button type="button" className="groups-cta groups-cta-ghost" onClick={() => setConfirmDeleteExpense(null)}>Cancel</button>
              <button type="button" className="groups-cta" onClick={deleteExpense}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GroupDetailsPage;

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRightLeft, BarChart3, Bell, ChevronLeft, Pencil, Plus, ReceiptText, Trash2, Users, Wallet, X } from 'lucide-react';
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
    };
  };

  const memberLookup = useMemo(() => {
    const map = new Map();
    (groupDetails?.members || []).forEach((member) => {
      const id = String(member.userId);
      const email = member.emailSnapshot || '';
      const displayName = member.displayNameSnapshot || '';
      const fallback = email ? email.split('@')[0] : '';
      const label = displayName || (fallback ? `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)}` : id);
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

  const getMemberLabel = (userId) => memberLookup.get(String(userId))?.label || String(userId).slice(-6);
  const getMemberRole = (userId) => memberLookup.get(String(userId))?.role || 'Member';
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

  return (
    <section className="groups-page-premium">
      <header className="groups-premium-hero">
        <div>
          <h1>{groupDetails?.name || 'Group Workspace'}</h1>
          <p>Track shared expenses, settlements, and analytics in one workspace.</p>
          <Link to="/groups" className="groups-back-link"><ChevronLeft size={14} /> Back to groups</Link>
        </div>
        <div className="groups-hero-actions">
          <button type="button" className="groups-cta" onClick={openCreateExpense}><Plus size={14} /> Add Expense</button>
          <button type="button" className="groups-cta groups-cta-ghost" onClick={() => setShowSettlementModal(true)}><ArrowRightLeft size={14} /> Settle</button>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {loading && <p className="dashboard-loading">Loading group workspace...</p>}

      {groupDetails && (
        <>
          <section className="group-header-banner">
            <div>
              <h2>{groupDetails.name}</h2>
              <p>{groupDetails.description || 'Track shared expenses and settle up cleanly.'}</p>
              <div className="group-member-avatars">
                {memberList.map((member) => (
                  <span key={member.id} className="group-avatar-pill" title={member.label}>
                    {member.label.slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <div className="group-invite-card">
              <span>Invite Code</span>
              <strong>{groupDetails.inviteCode}</strong>
            </div>
          </section>

          <section className="group-kpi-grid">
            <article><span>Members</span><strong>{groupDetails.members?.length || 0}</strong></article>
            <article><span>Expenses</span><strong>{analytics?.groupOverview?.expenseCount || expenses.length}</strong></article>
            <article><span>Total Spent</span><strong>{formatCurrency(analytics?.groupOverview?.totalSpent || 0, 'INR')}</strong></article>
            <article><span>Your Balance</span><strong>{formatCurrency(analytics?.groupOverview?.yourBalance || 0, 'INR')}</strong></article>
          </section>

          <nav className="group-tabs-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'is-active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === 'Overview' && (
            <div className="group-tab-grid">
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3><Users size={15} /> Members</h3>
                  <span className="group-panel-meta">Net balance by member</span>
                </div>
                <div className="group-member-list">
                  {memberBalances.map((member) => (
                    <div key={member.id} className="group-member-row">
                      <div className="group-member-info">
                        <span className="group-member-avatar">
                          {member.label.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{member.label}</strong>
                          <small>{member.email || member.role}</small>
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
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3>Recent Activity</h3>
                  <span className="group-panel-meta">Latest updates</span>
                </div>
                <div className="group-feed">
                  {activity.slice(0, 10).map((item) => (
                    <div key={item._id} className="group-feed-item">
                      <span>{item.title}</span>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                  {!activity.length && <p className="groups-empty-state">No recent activity.</p>}
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
              <div className="group-expense-list">
                {expenses.map((expense) => (
                  <button key={expense._id} type="button" className="group-expense-card" onClick={() => setSelectedExpense(expense)}>
                    {(() => {
                      const myShare = getMyExpenseShare(expense);
                      const mySettled = getMyExpenseSettled(expense);
                      const myRemaining = Math.max(0, Number((myShare - mySettled).toFixed(2)));
                      const showMySettle =
                        currentMemberId &&
                        String(expense.paidByUserId) !== String(currentMemberId) &&
                        myShare > 0;

                      return (
                        <>
                    <div className="group-expense-main">
                      <div className="group-expense-title">
                        <strong>{expense.title}</strong>
                        <small>
                          {expense.category || 'Group Expense'} · Paid by {getMemberLabel(expense.paidByUserId)} ·{' '}
                          {new Date(expense.occurredAt || expense.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="group-expense-splits">
                        <span>Split between</span>
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
                      {showMySettle && (
                        <div className="group-expense-myshare">
                          <span>Your share</span>
                          <strong>{formatCurrency(myShare, 'INR')}</strong>
                          {mySettled > 0 && <small>Settled {formatCurrency(mySettled, 'INR')}</small>}
                          {myRemaining > 0 && <small>Remaining {formatCurrency(myRemaining, 'INR')}</small>}
                        </div>
                      )}
                    </div>
                    <div className="group-expense-actions">
                      <strong>{formatCurrency(expense.amount, 'INR')}</strong>
                      <div className="group-expense-badges">
                        <span className={`group-chip ${expense.settlementStatus === 'settled' ? 'group-chip-success' : 'group-chip-warning'}`}>
                          {expense.settlementStatus || 'pending'}
                        </span>
                        <span className="group-chip group-chip-muted">{expense.splitType} split</span>
                      </div>
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
                {!expenses.length && <p className="groups-empty-state">No expenses added yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Settlements' && (
            <div className="group-tab-grid">
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3><ArrowRightLeft size={15} /> Settlement Suggestions</h3>
                  <button type="button" className="groups-cta" disabled={!simplifiedDebts.length || submittingSettleAll} onClick={settleAllSuggested}>
                    {submittingSettleAll ? 'Settling...' : 'Settle all'}
                  </button>
                </div>
                <div className="group-settlement-list">
                  {simplifiedDebts.map((item, index) => (
                    <div key={index} className="group-settle-row">
                      <div>
                        <strong>{getMemberLabel(item.fromUserId)}</strong>
                        <small>{getMemberRole(item.fromUserId)}</small>
                      </div>
                      <span className="group-settle-arrow">owes</span>
                      <div>
                        <strong>{getMemberLabel(item.toUserId)}</strong>
                        <small>{getMemberRole(item.toUserId)}</small>
                      </div>
                      <div className="group-settle-actions">
                        <strong>{formatCurrency(item.amount, 'INR')}</strong>
                        <button type="button" className="groups-cta" onClick={() => openSuggestedSettlement(item)}>
                          Settle Up
                        </button>
                      </div>
                    </div>
                  ))}
                  {!simplifiedDebts.length && <p className="groups-empty-state">No suggested settlements right now.</p>}
                </div>
              </article>
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3>Settlement History</h3>
                  <span className="group-panel-meta">Recent payouts</span>
                </div>
                <div className="group-feed">
                  {settlements.map((item) => (
                    <div key={item._id} className="group-feed-item">
                      <span>{getMemberLabel(item.paidByUserId)} paid {getMemberLabel(item.receivedByUserId)}</span>
                      <div className="group-settle-meta">
                        <strong>{formatCurrency(item.amount, 'INR')}</strong>
                        <small>{new Date(item.settledAt || item.createdAt).toLocaleDateString()}</small>
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
                  <h3>Transactions</h3>
                  <span className="group-panel-meta">Expenses and settlements</span>
                </div>
                <div className="group-transaction-list">
                  {transactionRows.map((row) => (
                    <div key={row.id} className="group-transaction-row">
                      <div>
                        <strong>{row.title}</strong>
                        <small>{row.subtitle}</small>
                      </div>
                      <div className="group-transaction-meta">
                        <span>{new Date(row.date).toLocaleDateString()}</span>
                        <strong className={row.amount >= 0 ? 'group-amount-positive' : 'group-amount-negative'}>
                          {formatCurrency(row.amount, 'INR')}
                        </strong>
                      </div>
                    </div>
                  ))}
                  {!transactionRows.length && <p className="groups-empty-state">No transactions yet.</p>}
                </div>
              </article>
              <article className="group-panel">
                <div className="group-panel-head">
                  <h3><Bell size={15} /> Notifications</h3>
                  <span className="group-panel-meta">Group alerts</span>
                </div>
                <div className="group-feed">
                  {notifications.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className={`group-feed-item ${item.read ? '' : 'group-noti-unread'}`}
                      onClick={() => markNotificationRead(item._id)}
                    >
                      <span>{item.title}</span>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </button>
                  ))}
                  {!notifications.length && <p className="groups-empty-state">No notifications yet.</p>}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="group-tab-grid">
              <article className="group-panel">
                <h3>Category Breakdown</h3>
                <div className="group-feed">
                  {categoryBlocks.map((item) => (
                    <div key={item.category} className="group-chart-row">
                      <div className="group-chart-label">
                        <span>{item.category}</span>
                        <small>{formatCurrency(item.amount, 'INR')}</small>
                      </div>
                      <div className="group-chart-bar"><span style={{ width: `${item.widthPercent}%` }} /></div>
                    </div>
                  ))}
                  {!categoryBlocks.length && <p className="groups-empty-state">No category data yet.</p>}
                </div>
              </article>
              <article className="group-panel">
                <h3>Member & Trend Insights</h3>
                <div className="group-feed">
                  <div className="group-feed-item">
                    <span>Top Spender</span>
                    <strong>{topSpender ? `${topSpender.label} (${formatCurrency(topSpender.amount, 'INR')})` : 'N/A'}</strong>
                  </div>
                  {monthlyTrend.map((row) => (
                    <div key={row.month} className="group-feed-item">
                      <span>{row.month}</span>
                      <strong>{formatCurrency(row.amount, 'INR')}</strong>
                    </div>
                  ))}
                </div>
              </article>
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


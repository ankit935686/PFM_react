import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const GroupsPage = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'General' });
  const [joinCode, setJoinCode] = useState('');

  const getAuthHeaders = async () => {
    if (!currentUser?.uid) return null;
    const token = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '',
    };
  };

  const loadGroups = async () => {
    if (!currentUser?.uid) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const response = await api.get('/api/groups', { headers });
      setGroups(response.data?.groups || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load groups.');
      setGroups([]);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [currentUser?.uid]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => {
      return (
        String(group.name || '').toLowerCase().includes(query) ||
        String(group.description || '').toLowerCase().includes(query) ||
        String(group.category || '').toLowerCase().includes(query)
      );
    });
  }, [groups, searchQuery]);

  const createGroup = async (event) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      setError('Group name is required.');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await api.post('/api/groups', createForm, { headers });
      setCreateForm({ name: '', description: '', category: 'General' });
      setShowCreateModal(false);
      await loadGroups();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to create group.');
    }
  };

  const joinGroup = async (event) => {
    event.preventDefault();
    if (!joinCode.trim()) {
      setError('Invite code is required.');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await api.post('/api/groups/join', { inviteCode: joinCode.trim() }, { headers });
      setJoinCode('');
      setShowJoinModal(false);
      await loadGroups();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to join group.');
    }
  };

  return (
    <section className="groups-page-premium">
      <header className="groups-premium-hero">
        <div>
          <h1>Groups Dashboard</h1>
          <p>Create or join groups and open a dedicated collaborative finance workspace for each one.</p>
        </div>
        <div className="groups-hero-actions">
          <button type="button" className="groups-cta" onClick={() => setShowCreateModal(true)}><Plus size={14} /> Create Group</button>
          <button type="button" className="groups-cta groups-cta-ghost" onClick={() => setShowJoinModal(true)}><Users size={14} /> Join Group</button>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="groups-left-rail">
        <div className="groups-search-wrap">
          <Search size={14} />
          <input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="groups-card-list groups-grid-cards">
          {filteredGroups.map((group) => (
            <Link key={group._id} className="group-card" to={`/groups/${group._id}`}>
              <div className="group-card-head">
                <strong>{group.name}</strong>
                {group.amOwner && <span className="group-owner-pill">Owner</span>}
              </div>
              <p>{group.description || 'No description added yet.'}</p>
              <div className="group-card-meta">
                <span>{group.memberCount} members</span>
                <span>{group.category || 'General'}</span>
              </div>
            </Link>
          ))}
          {!filteredGroups.length && <p className="groups-empty-state">No groups found.</p>}
        </div>
      </div>

      {(showCreateModal || showJoinModal) && (
        <div className="groups-modal-backdrop">
          <div className="groups-modal-card">
            <div className="groups-modal-head">
              <h3>{showCreateModal ? 'Create Group' : 'Join Group'}</h3>
              <button type="button" onClick={() => { setShowCreateModal(false); setShowJoinModal(false); }}><X size={14} /></button>
            </div>

            {showCreateModal && (
              <form className="group-form-grid" onSubmit={createGroup}>
                <input placeholder="Group name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
                <input placeholder="Category" value={createForm.category} onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))} />
                <textarea rows="3" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} />
                <button type="submit" className="groups-cta">Create Group</button>
              </form>
            )}

            {showJoinModal && (
              <form className="group-form-grid" onSubmit={joinGroup}>
                <input placeholder="Invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
                <button type="submit" className="groups-cta">Join Group</button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default GroupsPage;


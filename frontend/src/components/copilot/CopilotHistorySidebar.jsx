import { Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';

const CopilotHistorySidebar = ({
  sessions,
  search,
  setSearch,
  activeSessionId,
  onSelect,
  onCreate,
  onPin,
  onDelete,
}) => {
  return (
    <aside className="flex h-full flex-col border-r border-[#E8EAF6] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFF_100%)] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1E1E2D]">Copilot Sessions</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-[#D9DCFF] bg-[#EEF0FF] px-2 py-1 text-xs text-[#5B5BD6] hover:bg-[#E5E8FF]"
          onClick={onCreate}
        >
          <Plus size={12} /> New
        </button>
      </div>

      <label className="mb-3 flex items-center gap-2 rounded-xl border border-[#E8EAF6] bg-[#F8F9FF] px-2 py-1.5">
        <Search size={14} className="text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions..."
          className="w-full bg-transparent text-xs text-[#1E1E2D] placeholder:text-[#9CA3AF] focus:outline-none"
        />
      </label>

      <div className="space-y-2 overflow-y-auto pr-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(session.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(session.id);
              }
            }}
            className={`w-full rounded-xl border p-3 text-left transition ${
              activeSessionId === session.id
                ? 'border-[#D9DCFF] bg-[#EEF0FF]'
                : 'border-[#E8EAF6] bg-white hover:bg-[#F8F9FF]'
            }`}
          >
            <p className="line-clamp-1 text-xs font-semibold text-[#1E1E2D]">{session.title}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#7D8597]">
              <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
              <span>{session.messages.length} msgs</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[#E8EAF6] bg-white p-1 text-[#6B7280] hover:bg-[#F8F9FF]"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(session.id);
                }}
              >
                {session.pinned ? <Pin size={12} /> : <PinOff size={12} />}
              </button>
              <button
                type="button"
                className="rounded-md border border-[#E8EAF6] bg-white p-1 text-[#6B7280] hover:bg-[#F8F9FF]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default CopilotHistorySidebar;

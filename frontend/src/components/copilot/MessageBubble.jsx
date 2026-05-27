import { motion } from 'framer-motion';
import { Copy, RefreshCcw } from 'lucide-react';

const MotionArticle = motion.article;

const lineToNode = (line, index, isUser) => {
  const trimmed = line.trim();
  const headingClass = isUser ? 'text-white' : 'text-[#1E1E2D]';
  const bodyClass = isUser ? 'text-violet-50/95' : 'text-[#374151]';
  if (!trimmed) return <div key={`line-${index}`} className="h-2" />;
  if (trimmed.startsWith('### ')) return <h4 key={`line-${index}`} className={`text-sm font-semibold ${headingClass}`}>{trimmed.slice(4)}</h4>;
  if (trimmed.startsWith('## ')) return <h3 key={`line-${index}`} className={`text-base font-semibold ${headingClass}`}>{trimmed.slice(3)}</h3>;
  if (trimmed.startsWith('# ')) return <h2 key={`line-${index}`} className={`text-lg font-bold ${headingClass}`}>{trimmed.slice(2)}</h2>;
  if (trimmed.startsWith('- ')) return <li key={`line-${index}`} className={`ml-4 list-disc text-sm ${bodyClass}`}>{trimmed.slice(2)}</li>;
  return <p key={`line-${index}`} className={`text-sm leading-relaxed ${bodyClass}`}>{trimmed}</p>;
};

const MarkdownLite = ({ text, isUser }) => {
  const lines = String(text || '').split('\n');
  return <div className="space-y-2">{lines.map((line, i) => lineToNode(line, i, isUser))}</div>;
};

const MessageBubble = ({ message, onCopy, onRegenerate }) => {
  const isUser = message.role === 'user';
  return (
    <MotionArticle
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`group rounded-2xl border p-4 ${
        isUser
          ? 'ml-auto max-w-[88%] border-[#D9DCFF] bg-gradient-to-br from-[#5B5BD6] to-[#7C6EF2] text-white'
          : 'max-w-[94%] border-[#E8EAF6] bg-white'
      }`}
    >
      <MarkdownLite text={message.text} isUser={isUser} />
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#7D8597]">
        <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {message.provider ? <span className="rounded-full border border-[#E8EAF6] px-2 py-0.5 uppercase">{message.provider}</span> : null}
      </div>
      {!isUser && (
        <div className="mt-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#E8EAF6] bg-[#F8F9FF] px-2 py-1 text-xs text-[#5B5BD6] hover:bg-[#EEF0FF]"
            onClick={() => onCopy(message.text)}
          >
            <Copy size={12} /> Copy
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#E8EAF6] bg-[#F8F9FF] px-2 py-1 text-xs text-[#5B5BD6] hover:bg-[#EEF0FF]"
            onClick={() => onRegenerate(message)}
          >
            <RefreshCcw size={12} /> Regenerate
          </button>
        </div>
      )}
    </MotionArticle>
  );
};

export default MessageBubble;

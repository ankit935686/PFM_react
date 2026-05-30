import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`ww-theme-toggle ${className}`.trim()}
      style={{
        width: 44,
        height: 24,
        borderRadius: 99,
        border: '1px solid var(--border)',
        background: isDark ? 'var(--accent)' : 'var(--bg-elevated)',
        padding: 3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <span
        className="ww-theme-knob"
        style={{
          height: 18,
          width: 18,
          borderRadius: '50%',
          background: '#fff',
          color: isDark ? 'var(--accent)' : '#f59e0b',
          transform: isDark ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 0.3s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
        }}
      >
        {isDark ? <Moon size={11} /> : <Sun size={11} />}
      </span>
    </button>
  );
};

export default ThemeToggle;

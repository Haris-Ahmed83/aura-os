import { useState } from 'react';
import { Home, Book, CreditCard, Settings, User } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: <Home size={20} />, target: 'dashboard' },
  { name: 'Journal',   icon: <Book size={20} />, target: 'journal' },
  { name: 'Finance',   icon: <CreditCard size={20} />, target: 'finance' },
  { name: 'Settings',  icon: <Settings size={20} />, target: 'settings' },
  { name: 'Profile',   icon: <User size={20} />, target: 'profile' },
];

export const BottomNav = ({ active, onSelect }: { active: string; onSelect: (t: string) => void }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <nav className="bottom-nav">
      {navItems.map(({ name, icon, target }) => (
        <button
          key={target}
          className={`nav-btn ${active === target ? 'active' : ''} ${hovered === target ? 'hovered' : ''}`}
          onClick={() => onSelect(target)}
          onMouseEnter={() => setHovered(target)}
          onMouseLeave={() => setHovered(null)}
        >
          {icon}
          <span className="label">{name}</span>
        </button>
      ))}
    </nav>
  );
};

import { Link, useLocation } from 'react-router-dom';
import { Home, Swords, Code, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, labelKey: 'bottomNav.home' },
    // { path: '/battle', icon: Swords, label: '랭킹' },
    // { path: '/battle', icon: Code, label: '코드 배틀' },
    { path: '/profile', icon: User, labelKey: 'bottomNav.profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gaming-dark border-t border-gray-800">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.labelKey}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 ${
                isActive(item.path) 
                  ? 'text-primary-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{t(item.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
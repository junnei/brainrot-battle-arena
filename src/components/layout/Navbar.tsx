import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gaming-dark border-b border-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Gamepad2 className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold">Brainrot Battle Arena</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-gaming-light hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <User className="h-4 w-4 mr-1" />
                  {user?.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gaming-light hover:text-accent-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t('profilePage.logoutButton')}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="text-gaming-light hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <LogIn className="h-4 w-4 mr-1" />
                {t('authPage.loginTitle')} / {t('authPage.signupTitle')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
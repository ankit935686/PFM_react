import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopNav = () => {
  const { currentUser } = useAuth();

  return (
    <header className="top-nav-wrap">
      <nav className="top-nav">
        <Link className="brand" to="/">
          WealthWise
        </Link>

        <div className="top-nav-links">
          <Link to="/">Home</Link>
          {!currentUser && <Link to="/login">Login</Link>}
          {!currentUser && <Link to="/signup">Sign up</Link>}
          {currentUser && <Link to="/dashboard">Dashboard</Link>}
        </div>
      </nav>
    </header>
  );
};

export default TopNav;

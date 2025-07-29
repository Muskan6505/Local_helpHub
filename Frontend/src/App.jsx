import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import {
  Welcome,
  Signup,
  Login,
  Profile,
  RequestFeed,
  CreateRequest,
  Request,
  Dashboard,
  ChatPage,
  SOSpage,
  Notifications
} from './pages/index.js';

import AuthenticatedLayout from './layout/Authenticated.jsx';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { login, logout } from './features/userSlice.js';
import axios from 'axios';

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const res = await axios.post('/api/v1/users/refresh', {}, { withCredentials: true });
        if (res.status === 200 && res.data?.data) {
          dispatch(login(res.data.data));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    refreshToken();
  }, [dispatch]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-black via-indigo-950 to-pink-900">
      <div className="w-12 h-12 border-4 border-white border-dashed rounded-full animate-spin"></div>
        <p className="ml-4 text-white text-xl">Loading...</p>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

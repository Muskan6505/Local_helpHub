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
  Notifications,
  NotFound
} from './pages/index.js';

import AuthenticatedLayout from './layout/Authenticated.jsx';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { login, logout } from './features/userSlice.js';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const res = await axios.post('/api/v1/users/refresh', {}, { withCredentials: true });
        if (res.status === 200 && res.data?.data) {
          dispatch(login(res.data.data));
          toast.success("Welcome back!");
        } else {
          dispatch(logout());
        }
      } catch (err) {
        dispatch(logout());
        toast.error("Session expired. Please log in again.");
      } finally {
        setLoading(false);
      }
    };

    refreshToken();
  }, [dispatch]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-white via-sky-50 to-sky-100">
      <div className="w-12 h-12 border-4 border-black border-dashed rounded-full animate-spin"></div>
      <p className="ml-4 text-black text-xl">Loading...</p>
    </div>
  );

  return (
    <BrowserRouter>
      {/* ✅ Toastify container */}
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/requests" element={<RequestFeed />} />
          <Route path="/requests/create" element={<CreateRequest />} />
          <Route path="/requests/:id" element={<Request />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/sos" element={<SOSpage />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

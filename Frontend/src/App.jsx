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
  NotFound,
  MyRequest,
  EditRequest,
  CommunityFeed,
  ReportIssue,
  CommunityPostDetail
} from './pages/index.js';

import AuthenticatedLayout from './layout/Authenticated.jsx';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from './features/userSlice.js';
import axios from 'axios';
import { socket } from './utils/socket.js';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state) => state.user);
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
      } catch {
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    refreshToken();
  }, [dispatch]);

  // Global Real-time Message Notifications
  useEffect(() => {
    if (isLoggedIn && user?._id) {
      socket.auth = { userId: user._id };
      if (!socket.connected) {
        socket.connect();
      }

      const handleNotification = ({ message }) => {
        const senderName = message.sender?.name || "Neighbor";
        const snippet = message.text || "Sent an image attachment";
        toast.info(`💬 ${senderName}: ${snippet.length > 40 ? snippet.slice(0, 40) + "..." : snippet}`);
      };

      socket.on("newMessageNotification", handleNotification);

      return () => {
        socket.off("newMessageNotification", handleNotification);
      };
    } else if (socket.connected) {
      socket.disconnect();
    }
  }, [isLoggedIn, user?._id]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-white via-sky-50 to-sky-100">
      <div className="w-12 h-12 border-4 border-black border-dashed rounded-full animate-spin"></div>
      <p className="ml-4 text-black text-xl">Loading...</p>
    </div>
  );

  return (
    <BrowserRouter>
      {/* âœ… Toastify container */}
      <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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
          <Route path="/myrequests" element={<MyRequest />} />
          <Route path="/requests/create" element={<CreateRequest />} />
          <Route path="/requests/:id" element={<Request />} />
          <Route path="/edit-request/:id" element={<EditRequest />} />
          <Route path="/chat/:receiverId/:requestId" element={<ChatPage />} />
          <Route path="/community" element={<CommunityFeed />} />
          <Route path="/community/report" element={<ReportIssue />} />
          <Route path="/community/:id" element={<CommunityPostDetail />} />
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

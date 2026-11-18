import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { socket } from "../utils/socket";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import moment from "moment";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  CheckCheck,
  ShieldAlert,
  AlertCircle
} from "lucide-react";

const ChatPage = () => {
  const { receiverId, requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [receiverProfile, setReceiverProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------------- FETCH RECEIVER PROFILE ---------------- */
  useEffect(() => {
    if (!receiverId) return;

    const fetchReceiverProfile = async () => {
      try {
        const res = await axios.get(`/api/v1/users/${receiverId}`, {
          withCredentials: true
        });
        if (res.data?.success) {
          setReceiverProfile(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch receiver profile", err);
      }
    };

    fetchReceiverProfile();
  }, [receiverId]);

  /* ---------------- LOAD MESSAGE HISTORY ---------------- */
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/messages/${requestId}`, {
        withCredentials: true
      });
      if (res.data?.data) {
        setMessages(res.data.data);
      } else if (Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAuthError(err.response?.data?.message || "Chat is only accessible after a response is accepted.");
      } else {
        toast.error("Failed to load chat history");
      }
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  /* ---------------- SOCKET SETUP & ROOM JOIN ---------------- */
  useEffect(() => {
    if (!user?._id) return;

    // Connect socket with user auth
    socket.auth = { userId: user._id };
    if (!socket.connected) {
      socket.connect();
    }

    // Join room with backend authorization verification
    socket.emit("joinChatRoom", { requestId }, (response) => {
      if (response && !response.success) {
        setAuthError(response.message || "Unauthorized to enter this chat room.");
      }
    });

    // Mark messages as seen in room
    socket.emit("markSeen", { requestId });

    // Socket Event Listeners
    const handleReceiveMessage = (msg) => {
      if (msg.requestId === requestId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // If message is from other user, acknowledge seen
        if (msg.sender?._id !== user._id && msg.sender !== user._id) {
          socket.emit("markSeen", { requestId });
        }
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId === receiverId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === receiverId) {
        setIsTyping(false);
      }
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleSeenUpdate = ({ requestId: seenReqId }) => {
      if (seenReqId === requestId) {
        setMessages((prev) =>
          prev.map((m) => {
            const isMine = (m.sender?._id || m.sender) === user._id;
            return isMine ? { ...m, seen: true, delivered: true } : m;
          })
        );
      }
    };

    const handleMessagesDelivered = ({ requestId: delReqId }) => {
      if (!delReqId || delReqId === requestId) {
        setMessages((prev) =>
          prev.map((m) => {
            const isMine = (m.sender?._id || m.sender) === user._id;
            return isMine && !m.seen ? { ...m, delivered: true } : m;
          })
        );
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("seenUpdate", handleSeenUpdate);
    socket.on("messagesDelivered", handleMessagesDelivered);

    return () => {
      socket.emit("leaveChatRoom", { requestId });
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("seenUpdate", handleSeenUpdate);
      socket.off("messagesDelivered", handleMessagesDelivered);
    };
  }, [user?._id, requestId, receiverId]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ---------------- IMAGE SELECTION ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------- TYPING EMITTER ---------------- */
  const handleTextChange = (e) => {
    setText(e.target.value);

    socket.emit("typing", { requestId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { requestId });
    }, 1500);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedImage) return;

    let imageUrl = "";

    try {
      if (selectedImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploadRes = await axios.post("/api/v1/messages/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        });

        if (uploadRes.data?.data?.imageUrl) {
          imageUrl = uploadRes.data.data.imageUrl;
        }
      }

      socket.emit(
        "sendMessage",
        {
          requestId,
          receiver: receiverId,
          text: text.trim(),
          image: imageUrl
        },
        (res) => {
          if (res?.error) {
            toast.error(res.error);
          }
        }
      );

      setText("");
      removeSelectedImage();
      socket.emit("stopTyping", { requestId });
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message");
    } finally {
      setUploadingImage(false);
    }
  };

  const isReceiverOnline = onlineUsers.includes(receiverId);

  /* ---------------- UNAUTHORIZED PRIVACY GUARD ---------------- */
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Communication Restricted</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {authError}
          </p>
          <p className="text-xs text-gray-400">
            To protect user privacy, direct chat is only unlocked once the request creator officially accepts a helper's response.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Receiver Avatar with Presence indicator */}
          <div className="relative">
            {receiverProfile?.avatar ? (
              <img
                src={receiverProfile.avatar}
                alt={receiverProfile.name}
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {receiverProfile?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isReceiverOnline ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div>
            <h2 className="font-bold text-gray-900 text-base leading-tight">
              {receiverProfile?.name || "Neighbor"}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={isReceiverOnline ? "text-emerald-600 font-semibold" : ""}>
                {isReceiverOnline ? "Online" : "Offline"}
              </span>
              <span>•</span>
              <Link to={`/requests/${requestId}`} className="text-blue-600 hover:underline">
                View Request
              </Link>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
          <AlertCircle size={14} />
          <span>Accepted Help Connection</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2 text-blue-600" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Coordinate meeting details, timing, or assistance needs safely.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender?._id || msg.sender;
            const isMine = senderId === user._id;

            return (
              <div
                key={msg._id}
                className={`flex flex-col max-w-[78%] sm:max-w-[55%] ${
                  isMine ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs"
                  }`}
                >
                  {/* Attached Image if present */}
                  {msg.image && (
                    <a
                      href={msg.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-2 rounded-xl overflow-hidden max-h-60 bg-black/10"
                    >
                      <img
                        src={msg.image}
                        alt="Shared in chat"
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </a>
                  )}

                  {/* Message Text */}
                  {msg.text && (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                      {msg.text}
                    </p>
                  )}

                  {/* Timestamp & Status Ticks */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                      isMine ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    <span>{moment(msg.createdAt).format("h:mm A")}</span>
                    {isMine && (
                      <span title={msg.seen ? "Seen" : msg.delivered ? "Delivered" : "Sent"}>
                        {msg.seen ? (
                          <CheckCheck size={14} className="text-sky-300 inline" />
                        ) : msg.delivered ? (
                          <CheckCheck size={14} className="opacity-75 inline" />
                        ) : (
                          <Check size={14} className="opacity-75 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 backdrop-blur-sm border px-3 py-1.5 rounded-full w-max shadow-sm">
            <span className="font-medium">{receiverProfile?.name || "Helper"}</span> is typing
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Image Preview Bar before sending */}
      {imagePreview && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 rounded-xl overflow-hidden border">
              <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Ready to attach photo</span>
          </div>
          <button
            onClick={removeSelectedImage}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="bg-white border-t border-gray-200 p-3 sm:px-6">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-5xl mx-auto">
          {/* File input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Photo attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
            title="Attach a photo"
          >
            <ImageIcon size={20} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 focus:bg-white border border-transparent focus:border-blue-500 px-4 py-2.5 rounded-2xl text-sm focus:outline-none transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !selectedImage) || uploadingImage}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl transition disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md shadow-blue-500/20"
          >
            {uploadingImage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;

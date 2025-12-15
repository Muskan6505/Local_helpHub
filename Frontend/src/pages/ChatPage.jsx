import { useEffect, useState, useRef } from "react";
import { socket } from "../utils/socket";
import axios from "axios";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const ChatPage = () => {
  const { receiverId, requestId } = useParams();
  const { user } = useSelector((state) => state.user);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [receiverProfile, setReceiverProfile] = useState(null);

  const bottomRef = useRef(null);

  /* ---------------- RECEIVER PROFILE ---------------- */
  useEffect(() => {
    if (!receiverId) return;

    const fetchReceiverProfile = async () => {
      try {
        const res = await axios.get(`/api/v1/users/${receiverId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setReceiverProfile(res.data.data);
      } catch (err) {
        console.error("Failed to fetch receiver profile", err);
      }
    };

    fetchReceiverProfile();
  }, [receiverId, user.token]);

  /* ---------------- SOCKET CONNECTION ---------------- */
  useEffect(() => {
    if (!user?._id) return;

    socket.connect();
    socket.emit("join", user._id.toString());

    socket.on("receiveMessage", (msg) => {
      if (msg.requestId === requestId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", (senderId) => {
      if (senderId === receiverId) setTyping(true);
    });

    socket.on("stopTyping", (senderId) => {
      if (senderId === receiverId) setTyping(false);
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("seenUpdate", ({ requestId: seenReqId }) => {
      if (seenReqId === requestId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === user._id ? { ...m, seen: true } : m
          )
        );
      }
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [receiverId, requestId, user._id]);

  /* ---------------- LOAD OLD MESSAGES ---------------- */
  useEffect(() => {
    axios
      .get(`/api/v1/messages/${requestId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      .then((res) => {
        setMessages(res.data);
      });
  }, [requestId, user.token]);

  /* ---------------- MARK AS SEEN (IMPORTANT FIX) ---------------- */
  const isReceiverOnline = onlineUsers.includes(receiverId);

  useEffect(() => {
    if (!isReceiverOnline) return;

    socket.emit("markSeen", {
      userId: user._id,
      requestId
    });
  }, [isReceiverOnline, requestId, user._id]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("sendMessage", {
      sender: user._id.toString(),
      receiver: receiverId,
      requestId,
      text
    });

    setText("");
    socket.emit("stopTyping", {
      sender: user._id.toString(),
      receiver: receiverId
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-3 flex justify-between items-center">
        <div>
          <div className="font-semibold">
            {receiverProfile?.name || "Chat"}
          </div>
          <div className="text-xs opacity-80">
            {isReceiverOnline ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.sender === user._id;

          return (
            <div
              key={msg._id}
              className={`max-w-[45%] px-4 py-2 rounded-lg text-sm
                ${isMine ? "bg-blue-700 text-white ml-auto" : "bg-white"}
              `}
            >
              {msg.text}
              {isMine && (
                <div className="text-xs text-right mt-1">
                  {msg.seen ? "✔✔" : msg.delivered ? "✔" : "🕒"}
                </div>
              )}
            </div>
          );
        })}

        {typing && <div className="text-sm italic text-gray-500">Typing...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex p-3 bg-white border-t fixed bottom-0 w-full">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socket.emit("typing", {
              sender: user._id.toString(),
              receiver: receiverId
            });
          }}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-700 text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;

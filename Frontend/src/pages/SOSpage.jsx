import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useSelector } from "react-redux";
import LocationPicker from "../components/LocationPicker";
import { socket } from "../utils/socket";

const CATEGORIES = ["Medical", "Personal Safety", "Accident", "Fire", "Other"];

const statusStyles = {
  Active: "bg-red-100 text-red-700",
  Responded: "bg-amber-100 text-amber-700",
  Resolved: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

const SOSpage = () => {
  const { user } = useSelector((state) => state.user);
  const [form, setForm] = useState({
    category: "",
    description: "",
    lat: "",
    lng: "",
    address: "",
  });
  const [contacts, setContacts] = useState([{ name: "", phone: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [mine, setMine] = useState([]);
  const [nearby, setNearby] = useState([]);

  const setLocation = useCallback(({ lat, lng, address }) => {
    setForm((prev) => ({ ...prev, lat, lng, address }));
  }, []);

  const fetchSOS = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      const mineRequest = axios.get("/api/v1/sos/mine", { withCredentials: true });
      const nearbyRequest =
        lat && lng
          ? axios.get("/api/v1/sos", {
              params: { longitude: lng, latitude: lat, radius: 5000 },
              withCredentials: true,
            })
          : Promise.resolve({ data: { data: [] } });

      const [mineResult, nearbyResult] = await Promise.all([mineRequest, nearbyRequest]);
      setMine(mineResult.data?.data || []);
      setNearby(
        (nearbyResult.data?.data || []).filter(
          (sos) => sos.requester?._id?.toString() !== user?._id?.toString()
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load SOS requests");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchSOS();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          address: "",
        });
        fetchSOS(coords.latitude, coords.longitude);
      },
      () => fetchSOS(),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchSOS, setLocation]);

  useEffect(() => {
    const refresh = () => fetchSOS(form.lat, form.lng);
    socket.on("sosAlert", refresh);
    socket.on("sosResponded", refresh);
    socket.on("sosResolved", refresh);
    socket.on("sosCancelled", refresh);
    return () => {
      socket.off("sosAlert", refresh);
      socket.off("sosResponded", refresh);
      socket.off("sosResolved", refresh);
      socket.off("sosCancelled", refresh);
    };
  }, [fetchSOS, form.lat, form.lng]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const updateContact = (index, field, value) => {
    setContacts((prev) =>
      prev.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact
      )
    );
  };

  const submitSOS = async (event) => {
    event.preventDefault();
    if (!form.category) return toast.error("Please select an emergency category");
    if (!form.lat || !form.lng) return toast.error("Please provide your emergency location");

    const emergencyContacts = contacts
      .map((contact) => ({ name: contact.name.trim(), phone: contact.phone.trim() }))
      .filter((contact) => contact.name && contact.phone);

    try {
      setSubmitting(true);
      const { data } = await axios.post(
        "/api/v1/sos",
        {
          category: form.category,
          description: form.description.trim(),
          longitude: form.lng,
          latitude: form.lat,
          address: form.address,
          emergencyContacts,
        },
        { withCredentials: true }
      );
      toast.success(data.message || "SOS alert sent");
      setForm((prev) => ({ ...prev, category: "", description: "" }));
      await fetchSOS(form.lat, form.lng);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send SOS");
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (id, action, reason) => {
    try {
      setActionId(id);
      const url = `/api/v1/sos/${id}/${action}`;
      const { data } = await axios.patch(
        url,
        action === "cancel" ? { reason } : {},
        { withCredentials: true }
      );
      toast.success(data.message);
      await fetchSOS(form.lat, form.lng);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} SOS`);
    } finally {
      setActionId("");
    }
  };

  const cancelSOS = (id) => {
    const reason = window.prompt("Optional cancellation reason", "Emergency resolved");
    if (reason !== null) runAction(id, "cancel", reason);
  };

  const formatDate = (date) =>
    date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)) : "";

  const SOSCard = ({ sos, nearbyCard = false }) => {
    const requesterId = sos.requester?._id?.toString();
    const responderId = sos.respondedBy?._id?.toString();
    const isMine = requesterId === user?._id?.toString();
    const canResolve = isMine || responderId === user?._id?.toString();

    return (
      <article className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900">{sos.category}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {nearbyCard ? sos.requester?.name || "Community member" : "Sent"} · {formatDate(sos.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[sos.status]}`}>
            {sos.status}
          </span>
        </div>

        {sos.description && <p className="text-sm text-gray-700 mt-3">{sos.description}</p>}

        {sos.address && (
          <p className="flex items-start gap-2 text-sm text-gray-600 mt-3">
            <MapPin size={16} className="mt-0.5 shrink-0" />
            <span>{sos.address}</span>
          </p>
        )}

        {sos.respondedBy && (
          <p className="text-sm text-green-700 mt-3">
            <CheckCircle2 size={15} className="inline mr-1" />
            Responded by {sos.respondedBy.name || "a helper"}
          </p>
        )}

        {nearbyCard && sos.status === "Active" && (
          <button
            type="button"
            onClick={() => runAction(sos._id, "respond")}
            disabled={actionId === sos._id}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-60"
          >
            {actionId === sos._id ? <Loader2 size={18} className="animate-spin mx-auto" /> : "I can help"}
          </button>
        )}

        {(isMine || nearbyCard) && ["Active", "Responded"].includes(sos.status) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {canResolve && (
              <button
                type="button"
                onClick={() => runAction(sos._id, "resolve")}
                disabled={actionId === sos._id}
                className="border border-green-600 text-green-700 hover:bg-green-50 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                <CheckCircle2 size={16} className="inline mr-1" /> Resolve
              </button>
            )}
            {isMine && (
              <button
                type="button"
                onClick={() => cancelSOS(sos._id)}
                disabled={actionId === sos._id}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                <XCircle size={16} className="inline mr-1" /> Cancel
              </button>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-sky-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency SOS</h1>
            <p className="text-sm text-gray-600">Alert nearby community members and share your location.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 bg-white border border-red-100 rounded-3xl p-6 shadow-xl h-fit">
            <form onSubmit={submitSOS} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="" disabled>Select an emergency</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">What happened?</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe the situation briefly..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 resize-none focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Emergency location *
                </label>
                <LocationPicker
                  lat={form.lat}
                  lng={form.lng}
                  address={form.address}
                  setLocation={setLocation}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Emergency contacts
                </label>
                {contacts.map((contact, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      value={contact.name}
                      onChange={(event) => updateContact(index, "name", event.target.value)}
                      placeholder="Contact name"
                      className="border border-gray-300 rounded-xl px-3 py-2"
                    />
                    <input
                      value={contact.phone}
                      onChange={(event) => updateContact(index, "phone", event.target.value)}
                      placeholder="Phone number"
                      className="border border-gray-300 rounded-xl px-3 py-2"
                    />
                  </div>
                ))}
                {contacts.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setContacts((prev) => [...prev, { name: "", phone: "" }])}
                    className="text-sm text-red-600 font-medium hover:underline"
                  >
                    + Add another contact
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <AlertTriangle size={20} />}
                {submitting ? "Sending SOS..." : "Send Emergency SOS"}
              </button>
              <p className="text-xs text-center text-gray-500">
                For immediate life-threatening danger, also call your local emergency number.
              </p>
            </form>
          </section>

          <div className="lg:col-span-3 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">My SOS Requests</h2>
              {loading ? (
                <div className="text-gray-500 flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading...</div>
              ) : mine.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mine.slice(0, 6).map((sos) => <SOSCard key={sos._id} sos={sos} />)}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-white border rounded-2xl p-5">You have no SOS history.</p>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Nearby Emergencies</h2>
              {loading ? (
                <div className="text-gray-500 flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading...</div>
              ) : nearby.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nearby.map((sos) => <SOSCard key={sos._id} sos={sos} nearbyCard />)}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-white border rounded-2xl p-5">
                  No active emergencies within 5 km.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSpage;
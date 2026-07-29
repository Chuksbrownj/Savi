"use client"

import React, { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  Settings2, 
  Clock, 
  CreditCard, 
  History, 
  Compass, 
  MessageSquare, 
  Send,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Shirt,
  Sparkle
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const PAST_ORDERS = [
  { id: "ORD-948", status: "Delivered", date: "July 12, 2026", cost: "$38.00", items: "Wash & Fold" },
  { id: "ORD-832", status: "Delivered", date: "June 28, 2026", cost: "$55.00", items: "Dry Cleaning" }
];

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState<"book" | "track" | "history">("book");
  const [washType, setWashType] = useState("wash-fold");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("123 Victoria Island, Lagos");
  const [date, setDate] = useState("2026-07-25");
  const [time, setTime] = useState("10:00");
  
  // Track state
  const [currentOrder, setCurrentOrder] = useState<any>({
    id: "ORD-051",
    status: "Washing",
    step: 2,
    riderName: "Tunde Alao",
    eta: "Tomorrow, 2:00 PM"
  });

  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "model", content: "Hi! I'm Savi AI, your virtual laundry assistant. Ask me anything about stains, scheduling, or preferences!" }
  ]);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Laundry pickup scheduled successfully! Rider is being dispatched.");
    setCurrentOrder({
      id: "ORD-052",
      status: "AwaitingPickupAssignment",
      step: 1,
      riderName: "Pending Assign...",
      eta: "Today, within 2 hours"
    });
    setActiveTab("track");
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setLoadingAI(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: chatMessages.slice(-5) })
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: "model", content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: "model", content: "Sorry, I am having trouble connecting to my brain right now." }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "model", content: "Unable to process chat request at this time." }]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground max-w-md mx-auto border-x border-border relative pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            S
          </div>
          <span className="font-bold text-lg tracking-tight">Savi Laundry</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Tab Bodies */}
      <main className="flex-1 p-6 space-y-6">
        {activeTab === "book" && (
          <form onSubmit={handleBook} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Schedule a Pickup</h2>
              <p className="text-muted-foreground text-sm">Select wash preferences and set your schedule.</p>
            </div>

            {/* Wash Preferences */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">Service Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWashType("wash-fold")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    washType === "wash-fold"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-secondary/40"
                  }`}
                >
                  <Shirt className="h-6 w-6 mb-2" />
                  <span className="font-semibold text-sm">Wash & Fold</span>
                  <span className="text-xs text-muted-foreground mt-1">$2.50 / kg</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWashType("dry-clean")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    washType === "dry-clean"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-secondary/40"
                  }`}
                >
                  <Sparkle className="h-6 w-6 mb-2" />
                  <span className="font-semibold text-sm">Dry Clean</span>
                  <span className="text-xs text-muted-foreground mt-1">From $5.00 / item</span>
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Pickup & Delivery Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter address"
              />
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Preferences / Special Instructions */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <Settings2 className="h-4 w-4 text-primary" />
                Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
                placeholder="E.g., No fabric softener, dry flat, gentle spin..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>Schedule Free Pickup</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {activeTab === "track" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Track Order</h2>
              <p className="text-muted-foreground text-sm">Real-time status of your laundry.</p>
            </div>

            <div className="border border-border rounded-2xl p-6 bg-card space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Active Order ID</p>
                  <p className="font-mono font-bold text-lg">{currentOrder.id}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {currentOrder.status}
                </span>
              </div>

              {/* Steps visual */}
              <div className="space-y-4">
                {[
                  { title: "Pickup Assigned", desc: "Rider is heading to you", step: 1 },
                  { title: "Processing & Wash", desc: "Clothes are in washing machine", step: 2 },
                  { title: "Out for Delivery", desc: "Rider is bringing it back", step: 3 },
                  { title: "Delivered", desc: "Enjoy your fresh laundry", step: 4 }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                        currentOrder.step >= s.step
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}>
                        {s.step}
                      </div>
                      {s.step < 4 && (
                        <div className={`w-0.5 h-10 ${
                          currentOrder.step > s.step ? "bg-primary" : "bg-border"
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${currentOrder.step >= s.step ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Assigned Rider:</span>
                  <span className="font-semibold">{currentOrder.riderName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Estimated Delivery:</span>
                  <span className="font-semibold">{currentOrder.eta}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Order History</h2>
              <p className="text-muted-foreground text-sm">Review your past cleanings.</p>
            </div>

            <div className="space-y-3">
              {PAST_ORDERS.map((order, i) => (
                <div key={i} className="border border-border rounded-xl p-4 bg-card flex justify-between items-center hover:bg-secondary/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm">{order.id}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs text-green-500 font-semibold">{order.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{order.date} • {order.items}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{order.cost}</p>
                    <button className="text-xs text-primary font-semibold hover:underline mt-1">Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full border-t border-border bg-card/90 backdrop-blur-md grid grid-cols-3 py-2 z-40">
        <button
          onClick={() => setActiveTab("book")}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === "book" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-xxs font-medium">Book Pickup</span>
        </button>

        <button
          onClick={() => setActiveTab("track")}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === "track" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-5 w-5" />
          <span className="text-xxs font-medium">Track</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === "history" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-5 w-5" />
          <span className="text-xxs font-medium">History</span>
        </button>
      </nav>

      {/* AI Chat Bubble Toggle */}
      <button 
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-20 right-6 md:right-[calc(50vw-210px)] bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40 border border-primary/20"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* AI Chat Drawer */}
      {showAIChat && (
        <div className="fixed inset-y-0 right-0 max-w-md w-full bg-card border-l border-border z-50 flex flex-col shadow-2xl left-1/2 -translate-x-1/2">
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold">Savi Smart Stain Assistant</span>
            </div>
            <button 
              onClick={() => setShowAIChat(false)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Chat messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-foreground border border-border"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loadingAI && (
              <div className="flex justify-start">
                <div className="bg-secondary text-muted-foreground border border-border rounded-2xl px-4 py-2.5 text-sm animate-pulse">
                  Typing assistant response...
                </div>
              </div>
            )}
          </div>

          {/* Drawer Input */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-border bg-card flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about stains, washing methods..."
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              type="submit" 
              disabled={loadingAI}
              className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client"

import React, { useState } from "react";
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  User, 
  DollarSign, 
  Clock, 
  ChevronRight, 
  Power,
  RotateCcw,
  Sparkles,
  Phone,
  Layers
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const COMPLETED_TASKS = [
  { id: "ORD-004", address: "56 Adeniran Ogunsanya St, Surulere", payout: "₦1,200", status: "Delivered", time: "2 hours ago" },
  { id: "ORD-009", address: "14 Lekki Phase 1, Lagos", payout: "₦1,800", status: "Picked Up", time: "Yesterday" }
];

export default function DispatchApp() {
  const [online, setOnline] = useState(true);
  const [activeJob, setActiveJob] = useState<any>({
    id: "ORD-001",
    customer: "John Doe",
    phone: "+234 812 345 6789",
    pickupAddress: "123 Victoria Island, Lagos",
    dropoffAddress: "Savi Central Laundromat",
    status: "Awaiting Rider Pickup",
    step: 1 // 1: pickup route, 2: pick up completed, 3: delivery route
  });

  const handleUpdateStatus = () => {
    if (activeJob.step === 1) {
      setActiveJob((prev: any) => ({
        ...prev,
        status: "Transporting to Laundromat",
        step: 2
      }));
    } else if (activeJob.step === 2) {
      setActiveJob((prev: any) => ({
        ...prev,
        status: "Delivered to Laundromat",
        step: 3
      }));
      alert("Job Completed! Awaiting next assignment.");
      setActiveJob(null);
    }
  };

  const handleOpenNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground max-w-md mx-auto border-x border-border relative pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            R
          </div>
          <span className="font-bold text-lg tracking-tight">Savi Dispatch</span>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setOnline(!online)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              online 
                ? "bg-green-500/10 border-green-500 text-green-500" 
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <Power className="h-3 w-3" />
            <span>{online ? "Online" : "Offline"}</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Profile Card */}
        <div className="border border-border rounded-2xl p-5 bg-card flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-bold">Tunde Alao</p>
              <p className="text-xs text-muted-foreground">Level 3 Dispatch Rider</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Today's Earnings</p>
            <p className="text-xl font-black text-primary">₦8,400</p>
          </div>
        </div>

        {/* Active Job / Task */}
        {online && activeJob ? (
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span>Current Job Assignment</span>
            </h3>

            <div className="border border-border rounded-2xl p-6 bg-card space-y-6 relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-primary" />

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Order Reference</span>
                  <p className="font-mono font-bold">{activeJob.id}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500">
                  {activeJob.status}
                </span>
              </div>

              {/* Waypoints */}
              <div className="space-y-4 relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6.5 h-6.5 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-xs font-bold text-primary">
                    A
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Pick Up Location</p>
                    <p className="text-sm font-semibold mt-0.5">{activeJob.pickupAddress}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeJob.customer} • {activeJob.phone}</p>
                    <button 
                      onClick={() => handleOpenNavigation(activeJob.pickupAddress)}
                      className="flex items-center gap-1 text-primary text-xs font-bold hover:underline mt-2"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Navigate to A</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6.5 h-6.5 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                    B
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Drop Off Location</p>
                    <p className="text-sm font-semibold mt-0.5">{activeJob.dropoffAddress}</p>
                    <button 
                      onClick={() => handleOpenNavigation(activeJob.dropoffAddress)}
                      className="flex items-center gap-1 text-primary text-xs font-bold hover:underline mt-2"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Navigate to B</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex gap-3">
                <a 
                  href={`tel:${activeJob.phone}`}
                  className="flex items-center justify-center p-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </a>
                <button
                  onClick={handleUpdateStatus}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {activeJob.step === 1 ? "Mark Clothes Picked Up" : "Confirm Drop Off"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground bg-card space-y-2">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-semibold text-sm">
              {online ? "Waiting for new jobs..." : "You are currently offline"}
            </p>
            <p className="text-xs">
              {online ? "Make sure you stay in active zones for priority assignments." : "Go online to receive jobs."}
            </p>
          </div>
        )}

        {/* Recent Deliveries */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Completed Tasks Today</h3>
          <div className="space-y-2">
            {COMPLETED_TASKS.map((task, i) => (
              <div key={i} className="border border-border rounded-xl p-4 bg-card flex justify-between items-center hover:bg-secondary/20 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-sm">{task.id}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-green-500 font-semibold">{task.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{task.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-green-500">{task.payout}</p>
                  <p className="text-xxs text-muted-foreground mt-0.5">{task.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

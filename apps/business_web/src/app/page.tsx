"use client"

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Settings, 
  Search, 
  Bell, 
  Truck, 
  Clock, 
  MoreVertical, 
  User,
  Plus
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const INITIAL_ORDERS = [
  { id: "ORD-001", customer: "John Doe", status: "AwaitingPickupAssignment", items: 5, total: "$45.00", date: "Today, 10:15 AM", type: "Wash & Fold" },
  { id: "ORD-002", customer: "Sarah Jenkins", status: "Washing", items: 12, total: "$120.00", date: "Today, 09:30 AM", type: "Dry Cleaning" },
  { id: "ORD-003", customer: "Michael Smith", status: "PickupInProgress", items: 3, total: "$30.00", date: "Yesterday", type: "Iron Only" },
  { id: "ORD-004", customer: "Emily Davis", status: "Delivered", items: 8, total: "$65.00", date: "Yesterday", type: "Wash & Iron" },
  { id: "ORD-005", customer: "David Wilson", status: "AwaitingPayment", items: 4, total: "$40.00", date: "2 days ago", type: "Express Care" }
];

const RIDERS = [
  { id: "RIDER-1", name: "Tunde Alao", status: "Online", jobs: 2 },
  { id: "RIDER-2", name: "Chinedu Okafor", status: "OnJob", jobs: 1 },
  { id: "RIDER-3", name: "Musa Ibrahim", status: "Offline", jobs: 0 }
];

export default function BusinessDashboard() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [assigningRider, setAssigningRider] = useState(false);

  const handleAssignRider = (orderId: string, riderName: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "PickupAssigned", date: "Just now" } : o));
    setAssigningRider(false);
    setSelectedOrder(null);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">Savi Business</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary text-primary font-medium transition-colors">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <ShoppingBag className="h-5 w-5" />
              <span>Orders</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Users className="h-5 w-5" />
              <span>Riders</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <TrendingUp className="h-5 w-5" />
              <span>Analytics</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </a>
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-sm truncate">Laundromat Owner</p>
            <p className="text-xs text-muted-foreground truncate">owner@laundromat.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between">
          {/* Search bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search orders, customers..." 
              className="w-full bg-secondary pl-9 pr-4 py-1.5 rounded-lg text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-md border border-border hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Dash Body */}
        <main className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* Top Banner */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
              <p className="text-muted-foreground">Manage your dry cleaning operations in real-time.</p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" />
              <span>Create Custom Order</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-border rounded-xl p-6 bg-card space-y-2">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm font-medium">Total Orders Today</span>
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">24</div>
              <p className="text-xs text-green-500 font-medium">+12% from yesterday</p>
            </div>

            <div className="border border-border rounded-xl p-6 bg-card space-y-2">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm font-medium">Awaiting Pickups</span>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Need rider assignment</p>
            </div>

            <div className="border border-border rounded-xl p-6 bg-card space-y-2">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm font-medium">Active Riders</span>
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">2 / 3</div>
              <p className="text-xs text-green-500 font-medium">Riders online</p>
            </div>

            <div className="border border-border rounded-xl p-6 bg-card space-y-2">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm font-medium">Today's Revenue</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">$1,245.50</div>
              <p className="text-xs text-green-500 font-medium">+8.5% last hour</p>
            </div>
          </div>

          {/* Orders Section */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Active Order Queue</h3>
                <p className="text-sm text-muted-foreground">Track laundry states and dispatch task assignments.</p>
              </div>
              <div className="flex gap-2">
                <select className="bg-secondary border border-border rounded-lg text-sm px-3 py-1.5 focus:outline-none">
                  <option>All Statuses</option>
                  <option>Awaiting Pickup</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Service Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Order Total</th>
                  <th className="p-4">Last Update</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-mono font-semibold">{order.id}</td>
                    <td className="p-4 font-medium">{order.customer}</td>
                    <td className="p-4 text-muted-foreground">{order.type}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "Delivered" ? "bg-green-500/10 text-green-500" :
                        order.status === "Washing" ? "bg-blue-500/10 text-blue-500" :
                        order.status === "AwaitingPickupAssignment" ? "bg-yellow-500/10 text-yellow-500" :
                        order.status === "PickupAssigned" ? "bg-purple-500/10 text-purple-500" :
                        "bg-zinc-500/10 text-zinc-500"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">{order.total}</td>
                    <td className="p-4 text-muted-foreground text-xs">{order.date}</td>
                    <td className="p-4 text-right">
                      {order.status === "AwaitingPickupAssignment" ? (
                        <button 
                          onClick={() => { setSelectedOrder(order.id); setAssigningRider(true); }}
                          className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition-opacity"
                        >
                          Assign Rider
                        </button>
                      ) : (
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal - Assign Rider */}
      {assigningRider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Assign Dispatch Rider</h3>
              <p className="text-sm text-muted-foreground">Select a rider to assign to order {selectedOrder}.</p>
            </div>
            
            <div className="space-y-3">
              {RIDERS.map(rider => (
                <div key={rider.id} className="flex justify-between items-center p-3 rounded-lg border border-border hover:bg-secondary/40 transition-colors">
                  <div>
                    <p className="font-semibold text-sm">{rider.name}</p>
                    <p className="text-xs text-muted-foreground">{rider.jobs} active jobs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                      rider.status === "Online" ? "bg-green-500" :
                      rider.status === "OnJob" ? "bg-yellow-500" :
                      "bg-zinc-500"
                    }`} />
                    <button 
                      disabled={rider.status === "Offline"}
                      onClick={() => handleAssignRider(selectedOrder!, rider.name)}
                      className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setAssigningRider(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

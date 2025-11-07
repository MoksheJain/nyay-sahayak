"use client"
import { useState } from "react";
import {
  Bot,
  MessageSquare,
  FileText,
  LayoutDashboard,
  Users,
  HelpCircle,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";

export default function NyaySahayakDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("chats");
  const [user] = useState({
    name: "Advocate Sharma",
    email: "sharma@legal.com",
    avatar: "AS",
  });

  // Sample data for chat sessions
  const chatSessions = [
    {
      id: 1,
      topic: "Section 125 CrPC Query",
      client: "Rahul Verma",
      date: "08/11/2024",
      status: "Active",
      queries: 12,
    },
    {
      id: 2,
      topic: "Property Dispute Case",
      client: "Priya Singh",
      date: "07/11/2024",
      status: "Resolved",
      queries: 8,
    },
    {
      id: 3,
      topic: "Divorce Proceedings",
      client: "Amit Kumar",
      date: "06/11/2024",
      status: "Active",
      queries: 15,
    },
    {
      id: 4,
      topic: "Employment Law Issue",
      client: "Sneha Patel",
      date: "05/11/2024",
      status: "Active",
      queries: 5,
    },
    {
      id: 5,
      topic: "Consumer Rights Case",
      client: "Rajesh Gupta",
      date: "04/11/2024",
      status: "Closed",
      queries: 10,
    },
    {
      id: 6,
      topic: "Tax Compliance Query",
      client: "Meera Joshi",
      date: "03/11/2024",
      status: "Active",
      queries: 7,
    },
    {
      id: 7,
      topic: "Contract Dispute",
      client: "Vikram Rao",
      date: "02/11/2024",
      status: "Resolved",
      queries: 20,
    },
    {
      id: 8,
      topic: "Bail Application Help",
      client: "Anita Desai",
      date: "01/11/2024",
      status: "Active",
      queries: 9,
    },
  ];

  // Sample data for contracts
  const contracts = [
    {
      id: 1,
      name: "Employment Agreement",
      client: "Tech Corp Ltd",
      date: "08/11/2024",
      type: "Employment",
      status: "Generated",
    },
    {
      id: 2,
      name: "NDA Agreement",
      client: "Startup Inc",
      date: "07/11/2024",
      type: "Confidentiality",
      status: "Generated",
    },
    {
      id: 3,
      name: "Rental Agreement",
      client: "John William",
      date: "06/11/2024",
      type: "Real Estate",
      status: "Generated",
    },
    {
      id: 4,
      name: "Service Contract",
      client: "ABC Pvt Ltd",
      date: "05/11/2024",
      type: "Service",
      status: "Generated",
    },
    {
      id: 5,
      name: "Partnership Deed",
      client: "XYZ Partners",
      date: "04/11/2024",
      type: "Partnership",
      status: "Generated",
    },
    {
      id: 6,
      name: "Consultancy Agreement",
      client: "Legal Associates",
      date: "03/11/2024",
      type: "Consultancy",
      status: "Generated",
    },
    {
      id: 7,
      name: "Sale Agreement",
      client: "Property Dealers",
      date: "02/11/2024",
      type: "Sale",
      status: "Generated",
    },
    {
      id: 8,
      name: "Loan Agreement",
      client: "Finance Corp",
      date: "01/11/2024",
      type: "Finance",
      status: "Generated",
    },
  ];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chats", label: "Chat Sessions", icon: MessageSquare, badge: "15" },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "clients", label: "Clients", icon: Users },
    { id: "help", label: "Help Center", icon: HelpCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Nyay Sahayak
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeMenu === item.id
                        ? "bg-white text-blue-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Pro Card */}
        <div className="m-4 p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full flex items-center justify-center">
            <div className="text-3xl">🚀</div>
          </div>
          <h3 className="font-bold mb-2">Nyay Sahayak</h3>
          <p className="text-xs text-blue-100 mb-4">
            Get access to all features on Nyay Sahayak
          </p>
          <button className="w-full bg-white text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
            Go Pro
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeMenu === "dashboard" && "Dashboard"}
                {activeMenu === "chats" && "Chat Sessions"}
                {activeMenu === "contracts" && "Contracts"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {activeMenu === "dashboard" &&
                  "Overview of your legal assistance activities"}
                {activeMenu === "chats" &&
                  "Manage all your AI-powered legal consultations"}
                {activeMenu === "contracts" &&
                  "View and manage generated legal contracts"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-600">{user.email}</div>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.avatar}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {activeMenu === "chats" && (
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                      All
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                      Active
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                      Resolved
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                      Closed
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by topic / client"
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <span>Sort by</span>
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <span>Filter</span>
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Queries
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chatSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {session.topic}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.client}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.queries}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              session.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : session.status === "Resolved"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">01-09</span> of{" "}
                  <span className="font-medium">136</span> Sessions
                </p>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                    1
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    2
                  </button>
                  <span className="px-2 text-gray-600">...</span>
                  <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    12
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "contracts" && (
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                      All
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                      Employment
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                      Real Estate
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                      Service
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name / client"
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <span>Sort by</span>
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <span>Filter</span>
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                      <tr
                        key={contract.id}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {contract.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {contract.client}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {contract.date}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {contract.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {contract.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">01-09</span> of{" "}
                  <span className="font-medium">136</span> Contracts
                </p>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                    1
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    2
                  </button>
                  <span className="px-2 text-gray-600">...</span>
                  <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    12
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "dashboard" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Total Chat Sessions
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        136
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        ↑ 12% from last month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Contracts Generated
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        89
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        ↑ 8% from last month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Clients</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        42
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        ↑ 5% from last month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Resolved Cases</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        78
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        ↑ 15% from last month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-xl text-white">
                  <MessageSquare className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    Start New Chat Session
                  </h3>
                  <p className="text-blue-100 mb-6">
                    Get instant answers to any Indian law queries with our
                    AI-powered chatbot
                  </p>
                  <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    Start Chatting
                  </button>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-xl text-white">
                  <FileText className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    Generate Legal Contract
                  </h3>
                  <p className="text-green-100 mb-6">
                    Create professional legal contracts in minutes with AI
                    assistance
                  </p>
                  <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                    Generate Contract
                  </button>
                </div>
              </div>

              {/* History Tabs */}
              <div className="bg-white rounded-xl border border-gray-200">
                {/* Tab Headers */}
                <div className="border-b border-gray-200">
                  <div className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab("chats")}
                      className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "chats"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Chat History
                    </button>
                    <button
                      onClick={() => setActiveTab("contracts")}
                      className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "contracts"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Contract History
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "chats" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recent Chat Sessions
                        </h3>
                        <button
                          onClick={() => setActiveMenu("chats")}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All →
                        </button>
                      </div>
                      {chatSessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {session.topic}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {session.client} • {session.queries} queries
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              {session.date}
                            </span>
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                session.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : session.status === "Resolved"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {session.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "contracts" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recent Contracts
                        </h3>
                        <button
                          onClick={() => setActiveMenu("contracts")}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All →
                        </button>
                      </div>
                      {contracts.slice(0, 5).map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {contract.name}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {contract.client}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              {contract.date}
                            </span>
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {contract.type}
                            </span>
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {contract.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

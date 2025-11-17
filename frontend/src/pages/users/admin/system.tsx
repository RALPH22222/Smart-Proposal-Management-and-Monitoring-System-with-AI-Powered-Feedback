import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/sidebar';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  MemoryStick,
} from "lucide-react";

export default function SystemDetails() {
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy',
    lastUpdated: new Date().toISOString(),
    isRefreshing: false
  });

  const serverMetrics = [
    {
      id: 1,
      name: "Web Server",
      status: "running",
      cpu: 45,
      memory: 62,
      uptime: "15 days, 8 hours",
      responseTime: "120ms",
      color: "emerald"
    },
    {
      id: 2,
      name: "Database Server",
      status: "running",
      cpu: 28,
      memory: 45,
      uptime: "15 days, 8 hours",
      responseTime: "45ms",
      color: "emerald"
    },
    {
      id: 3,
      name: "File Storage",
      status: "warning",
      cpu: 15,
      memory: 78,
      uptime: "12 days, 3 hours",
      responseTime: "280ms",
      color: "amber"
    },
    {
      id: 4,
      name: "Cache Server",
      status: "running",
      cpu: 32,
      memory: 34,
      uptime: "8 days, 16 hours",
      responseTime: "15ms",
      color: "emerald"
    }
  ];

  const systemResources = [
    {
      id: 1,
      name: "CPU Usage",
      current: 45,
      max: 100,
      unit: "%",
      trend: "stable",
      icon: Cpu,
      color: "blue"
    },
    {
      id: 2,
      name: "Memory Usage",
      current: 62,
      max: 100,
      unit: "%",
      trend: "increasing",
      icon: MemoryStick,
      color: "purple"
    },
    {
      id: 3,
      name: "Disk Space",
      current: 78,
      max: 100,
      unit: "%",
      trend: "stable",
      icon: HardDrive,
      color: "emerald"
    },
    {
      id: 4,
      name: "Network I/O",
      current: 245,
      max: 1000,
      unit: "MB/s",
      trend: "decreasing",
      icon: Network,
      color: "orange"
    }
  ];

  const databaseMetrics = [
    {
      id: 1,
      metric: "Active Connections",
      value: "48",
      max: "100",
      status: "healthy"
    },
    {
      id: 2,
      metric: "Query Rate",
      value: "1,245",
      unit: "queries/sec",
      status: "healthy"
    },
    {
      id: 3,
      metric: "Cache Hit Rate",
      value: "94.2%",
      status: "excellent"
    },
    {
      id: 4,
      metric: "Replication Lag",
      value: "0.8s",
      status: "healthy"
    }
  ];

  const securityStatus = [
    {
      id: 1,
      check: "SSL Certificate",
      status: "valid",
      expires: "2025-12-31",
      icon: Shield
    },
    {
      id: 2,
      check: "Firewall",
      status: "active",
      details: "All rules enforced",
      icon: Shield
    },
    {
      id: 3,
      check: "API Rate Limiting",
      status: "enabled",
      details: "1000 req/min",
      icon: Activity
    },
    {
      id: 4,
      check: "Backup System",
      status: "active",
      details: "Last backup: 2 hours ago",
      icon: HardDrive
    }
  ];

  const recentEvents = [
    {
      id: 1,
      timestamp: "2024-01-15 14:30:23",
      type: "info",
      message: "System backup completed successfully",
      service: "Backup Service"
    },
    {
      id: 2,
      timestamp: "2024-01-15 13:45:12",
      type: "warning",
      message: "High memory usage detected on File Storage",
      service: "Monitoring"
    },
    {
      id: 3,
      timestamp: "2024-01-15 12:15:08",
      type: "info",
      message: "Database optimization completed",
      service: "Database"
    },
    {
      id: 4,
      timestamp: "2024-01-15 10:20:45",
      type: "info",
      message: "Security scan completed - no threats found",
      service: "Security"
    }
  ];

  const refreshData = async () => {
    setSystemStatus(prev => ({ ...prev, isRefreshing: true }));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSystemStatus({
      overall: 'healthy',
      lastUpdated: new Date().toISOString(),
      isRefreshing: false
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
      case 'valid':
      case 'active':
      case 'enabled':
      case 'excellent':
        return 'emerald';
      case 'warning':
        return 'amber';
      case 'error':
      case 'critical':
        return 'red';
      default:
        return 'slate';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
      case 'valid':
      case 'active':
      case 'enabled':
      case 'excellent':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
      case 'critical':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <header className="pt-11 sm:pt-0 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#C8102E] leading-tight">
                  System Details
                </h1>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Comprehensive system monitoring and performance metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  systemStatus.overall === 'healthy' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    systemStatus.overall === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  System {systemStatus.overall}
                </div>
                <button
                  onClick={refreshData}
                  disabled={systemStatus.isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${systemStatus.isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          {/* Server Status Section */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-[#C8102E]" />
              Server Status
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {serverMetrics.map((server) => {
                const StatusIcon = getStatusIcon(server.status);
                const colorClass = getStatusColor(server.status);
                return (
                  <div
                    key={server.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800">{server.name}</h3>
                      <StatusIcon className={`w-5 h-5 text-${colorClass}-500`} />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">CPU</span>
                        <span className="font-medium">{server.cpu}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Memory</span>
                        <span className="font-medium">{server.memory}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Uptime</span>
                        <span className="font-medium">{server.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Response</span>
                        <span className="font-medium">{server.responseTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* System Resources & Database Metrics */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* System Resources */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#C8102E]" />
                System Resources
              </h3>
              <div className="space-y-4">
                {systemResources.map((resource) => {
                  const IconComponent = resource.icon;
                  return (
                    <div key={resource.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">{resource.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {resource.current}{resource.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${resource.color}-500 transition-all duration-300`}
                          style={{ width: `${(resource.current / resource.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Database Metrics */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#C8102E]" />
                Database Performance
              </h3>
              <div className="space-y-3">
                {databaseMetrics.map((metric) => {
                  const colorClass = getStatusColor(metric.status);
                  return (
                    <div key={metric.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {metric.value} {metric.unit || ''}
                        </span>
                        {metric.max && (
                          <span className="text-xs text-slate-500">/ {metric.max}</span>
                        )}
                        <div className={`w-2 h-2 rounded-full bg-${colorClass}-500`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Security Status & Recent Events */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#C8102E]" />
                Security Status
              </h3>
              <div className="space-y-3">
                {securityStatus.map((item) => {
                  const IconComponent = item.icon;
                  const StatusIcon = getStatusIcon(item.status);
                  const colorClass = getStatusColor(item.status);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-4 h-4 text-slate-500" />
                        <div>
                          <div className="text-sm font-medium text-slate-700">{item.check}</div>
                          {item.details && (
                            <div className="text-xs text-slate-500">{item.details}</div>
                          )}
                          {item.expires && (
                            <div className="text-xs text-slate-500">Expires: {item.expires}</div>
                          )}
                        </div>
                      </div>
                      <StatusIcon className={`w-5 h-5 text-${colorClass}-500`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent System Events */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#C8102E]" />
                Recent System Events
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.type === 'info' ? 'bg-blue-500' : 
                      event.type === 'warning' ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{event.message}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{event.timestamp}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{event.service}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Last updated: {new Date(systemStatus.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
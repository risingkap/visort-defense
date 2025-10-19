// Health check script for monitoring backend performance
const os = require('os');

function getSystemHealth() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = (usedMem / totalMem) * 100;
  
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  
  return {
    memory: {
      total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      free: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      usagePercent: Math.round(memUsagePercent * 100) / 100
    },
    cpu: {
      loadAverage: loadAvg,
      coreCount: cpuCount,
      loadPercent: Math.round((loadAvg[0] / cpuCount) * 100 * 100) / 100
    },
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  };
}

function logHealthCheck() {
  const health = getSystemHealth();
  
  console.log('🏥 Health Check:', {
    memory: `${health.memory.usagePercent}% used (${health.memory.used}GB/${health.memory.total}GB)`,
    cpu: `${health.cpu.loadPercent}% load`,
    uptime: `${Math.round(health.uptime / 60)} minutes`
  });
  
  // Alert if memory usage is high
  if (health.memory.usagePercent > 80) {
    console.warn('⚠️ HIGH MEMORY USAGE:', health.memory.usagePercent + '%');
  }
  
  // Alert if CPU load is high
  if (health.cpu.loadPercent > 80) {
    console.warn('⚠️ HIGH CPU LOAD:', health.cpu.loadPercent + '%');
  }
}

module.exports = { getSystemHealth, logHealthCheck };

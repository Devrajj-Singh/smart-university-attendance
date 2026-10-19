import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Check environment variable override
    const envIp = process.env.NEXT_PUBLIC_LAN_IP || process.env.SERVER_LAN_IP;
    
    // 2. Inspect host header if accessed via LAN IP already
    const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const hostIp = hostHeader.split(':')[0];

    let detectedIp = '';

    // If request came from a LAN IP (e.g. 192.168.x.x or 10.x.x.x), use it directly
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1' && !hostIp.startsWith('172.') && !hostIp.startsWith('10.0.2.')) {
      detectedIp = hostIp;
    } else if (envIp) {
      detectedIp = envIp;
    } else {
      // 3. Scan host network interfaces
      const interfaces = os.networkInterfaces();
      const candidates: { name: string; ip: string; priority: number }[] = [];

      for (const [name, netList] of Object.entries(interfaces)) {
        if (!netList) continue;
        for (const net of netList) {
          if (net.family === 'IPv4' && !net.internal) {
            let priority = 1;
            const lowerName = name.toLowerCase();
            // Deprioritize Docker container bridge networks (172.16 - 172.31)
            if (net.address.startsWith('172.')) {
              priority = -1;
            } else if (lowerName.includes('wi-fi') || lowerName.includes('wlan') || lowerName.includes('en0')) {
              priority = 10;
            } else if (lowerName.includes('ethernet') || lowerName.includes('eth0')) {
              priority = 8;
            } else if (lowerName.includes('vethernet') || lowerName.includes('docker') || lowerName.includes('br-')) {
              priority = 2;
            }
            candidates.push({ name, ip: net.address, priority });
          }
        }
      }

      candidates.sort((a, b) => b.priority - a.priority);
      const top = candidates.find(c => c.priority > 0);
      detectedIp = top ? top.ip : '192.168.1.6';
    }

    const port = hostHeader.includes(':') ? hostHeader.split(':')[1] : (process.env.PORT || '3000');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${detectedIp}:${port}`;

    return NextResponse.json({
      success: true,
      lanIp: detectedIp,
      port,
      baseUrl,
      allInterfaces: os.networkInterfaces(),
    });
  } catch (err: any) {
    console.error('[API/NETWORK/LAN-IP] Error:', err);
    return NextResponse.json({
      success: false,
      lanIp: '127.0.0.1',
      port: '3000',
      baseUrl: 'http://localhost:3000',
    });
  }
}

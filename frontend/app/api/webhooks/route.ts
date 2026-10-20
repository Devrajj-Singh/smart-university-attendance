import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  getRegisteredWebhooks, 
  registerWebhook, 
  deleteWebhook, 
  toggleWebhook, 
  getWebhookDeliveryLogs 
} from '@/lib/webhooks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const subscriptions = getRegisteredWebhooks();
    const logs = getWebhookDeliveryLogs(25);

    return NextResponse.json({
      success: true,
      subscriptions,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const body = await req.json();
    const { url, name, eventTypes, secret } = body;

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid HTTP/HTTPS target URL is required' }, { status: 400 });
    }

    const sub = registerWebhook(url, name || 'Custom Webhook Listener', eventTypes || [], secret);

    return NextResponse.json({
      success: true,
      subscription: sub,
      message: 'Webhook subscription registered successfully with HMAC SHA-256 signature enforcement.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const deleted = deleteWebhook(id);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Webhook listener removed.' : 'Listener not found.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const updated = toggleWebhook(id);

    return NextResponse.json({
      success: !!updated,
      subscription: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

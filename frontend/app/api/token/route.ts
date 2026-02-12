
import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const roomName = req.nextUrl.searchParams.get('room') || 'playground-' + Math.random().toString(36).substring(7);
    const participantName = req.nextUrl.searchParams.get('username') || 'user-' + Math.random().toString(36).substring(7);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, roomName });
}

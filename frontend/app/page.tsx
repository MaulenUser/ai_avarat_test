"use client";

import {
    LiveKitRoom,
    RoomAudioRenderer,
    VideoTrack,
    useTracks,
    useLocalParticipant,
    useConnectionState,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, ConnectionState } from "livekit-client";
import { useEffect, useState } from "react";

export default function Home() {
    const [token, setToken] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch("/api/token");
                const data = await resp.json();
                setToken(data.token);
                setUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL || "");
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    <p className="text-sm font-light tracking-widest uppercase text-gray-400">Initializing Neural Link...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">

            {/* Background Ambient Effect */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px]"></div>
            </div>

            <LiveKitRoom
                video={false}
                audio={true}
                token={token}
                serverUrl={url}
                connect={true}
                data-lk-theme="default"
                className="z-10 w-full h-full flex flex-col items-center justify-center relative"
            >
                <div className="relative w-full max-w-4xl aspect-video md:aspect-[16/9] lg:aspect-[21/9] flex items-center justify-center p-4">
                    {/* Avatar Container with Glow */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden glass-panel animate-breathe transition-all duration-500">
                        <VideoComponent />

                        {/* Connection Status Overlay */}
                        <div className="absolute top-4 left-4">
                            <ConnectionStatus />
                        </div>
                    </div>
                </div>

                {/* Floating Control Bar */}
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 glass-panel px-6 py-3 rounded-full flex gap-6 items-center z-20 transition-all hover:scale-105 duration-300">
                    <MicButton />
                    {/* Add more controls like disconnect here if needed */}
                </div>

                <RoomAudioRenderer />
            </LiveKitRoom>
        </main>
    );
}

function VideoComponent() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
        ],
        { onlySubscribed: false }
    );

    return (
        <>
            {tracks
                .filter((track) => track.publication !== undefined)
                .map((track) => (
                    <VideoTrack
                        key={track.publication!.trackSid}
                        trackRef={track as import("@livekit/components-react").TrackReference}
                        className="w-full h-full object-cover"
                    />
                ))}
            {tracks.length === 0 && (
                <div className="w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <p className="text-gray-400 font-light tracking-widest text-sm animate-pulse">WAITING FOR NEURAL FEED...</p>
                </div>
            )}
        </>
    );
}

function MicButton() {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(false);

    const toggleMic = async () => {
        if (localParticipant) {
            const enabled = !localParticipant.isMicrophoneEnabled;
            await localParticipant.setMicrophoneEnabled(enabled);
            setIsMuted(!enabled);
        }
    };

    return (
        <button
            onClick={toggleMic}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${!isMuted
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                }`}
        >
            <span className="material-icons text-white text-xl font-bold">
                {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 6.787 0M12 18.75a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 animate-pulse">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                )}
            </span>
        </button>
    )
}

function ConnectionStatus() {
    const connectionState = useConnectionState();

    const getStatusColor = () => {
        switch (connectionState) {
            case ConnectionState.Connected:
                return "bg-emerald-500";
            case ConnectionState.Connecting:
                return "bg-yellow-500";
            case ConnectionState.Disconnected:
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-0 bg-black/20">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">{connectionState}</span>
        </div>
    )
}

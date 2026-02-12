import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    llm,
    room_io,
)
from livekit.plugins import elevenlabs, noise_cancellation, openai, silero, tavus
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""Вы — полезный и дружелюбный голосовой AI-помощник, который может отвечать на любые общие вопросы.
            Ваша главная задача — помогать пользователю с любыми запросами.
            В самом начале разговора обязательно поприветствуйте пользователя на двух языках (русском и казахском), спросите как дела и чем вы можете помочь.
            Пример: "Сәлеметсіз бе! Здравствуйте! Қалайсыз? Как ваши дела? Чем я могу вам помочь сегодня?"
            Отвечайте на том языке, на котором к вам обращается пользователь (русский или казахский).
            Говорите четко и естественно.
            ВАЖНО: При разговоре на казахском языке, если нужно, корректируйте написание слов для более естественного звучания в Text-to-Speech (например, используйте кириллические приближения для специфических звуков).
            Ваши ответы должны быть лаконичными, по существу, без сложного форматирования, эмодзи или спецсимволов.
            Вы любознательны, дружелюбны и обладаете чувством юмора.""",
        )

server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session()
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    session = AgentSession(
        stt=elevenlabs.STT(model_id="scribe_v2_realtime"),
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        tts=openai.TTS(
            model="gpt-4o-mini-tts",
            voice="shimmer",
            instructions="Speak in a friendly and conversational tone.",
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    @session.on("user_speech_committed")
    def on_user_speech_committed(msg: llm.ChatMessage):
        logger.info(f"User speech verified: {msg.content}")

    @session.on("user_speech_transcribed")
    def on_user_speech_transcribed(msg):
        logger.info(f"User speech transcribed: {msg.message}")

    avatar = tavus.AvatarSession(
        replica_id="r6ae5b6efc9d",  # Swapped: likely the correct Replica ID
        persona_id="p1b06420cfdc",  # Swapped: likely the correct Persona ID
    )

    await avatar.start(session, room=ctx.room)

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)

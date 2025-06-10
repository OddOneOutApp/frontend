import { FontAwesomeIcon } from "@/components/FontAwesomeIcon.tsx";
import {
    createReconnectingWS,
    createWSState,
} from "@solid-primitives/websocket";
import { useParams, RouteSectionProps } from "@solidjs/router";
import {
    createEffect,
    on,
    Component,
    For,
    createSignal,
    onMount,
    onCleanup,
    Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
    faLink,
    faUserGroup,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";

type User = {
    id: string;
    name: string;
    answer: string;
    online: boolean;
    vote: string;
    host: boolean;
};

const parseMessage = (msg: string) => {
    const data = JSON.parse(msg);
    data.user_id = parseUUID(data.user_id);
    return data;
};

const parseUUID = (uuid: any) => {
    if (Array.isArray(uuid)) {
        return uuid
            .map((num: number) => num.toString(16).padStart(2, "0"))
            .join("")
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
    }
    return "00000000-0000-0000-0000-000000000000";
};

const uuidToArray = (uuid: string): number[] => {
    // Remove dashes and split into pairs of hex digits
    const hex = uuid.replace(/-/g, "");
    if (hex.length !== 32) return [];
    const arr: number[] = [];
    for (let i = 0; i < 32; i += 2) {
        arr.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return arr;
};

enum MessageType {
    Join = "join",
    Leave = "leave",
    GameDelete = "game_delete",
    UserStatus = "user_status",
    Init = "init",
    UpdateUser = "update_user",
    Start = "start", // sent by client
    Question = "question",
    Answer = "answer", // sent by client
    Answers = "answers",
    Vote = "vote", // sent by client
    VoteResult = "vote_result",
}

enum GameState {
    Lobby = "lobby",
    Answering = "answering",
    Voting = "voting",
    Finished = "finished",
    Deleted = "deleted",
}

const Game: Component<RouteSectionProps> = (props) => {
    const params = useParams();
    const gameID = params.gameID;

    const [users, setUsers] = createStore<User[]>([]);
    const [question, setQuestion] = createSignal("");
    const [answersEndTime, setAnswersEndTime] = createSignal<number | null>(
        null
    );
    const [votingEndTime, setVotingEndTime] = createSignal<number | null>(null);
    const [actualQuestion, setActualQuestion] = createSignal("");
    const [gameState, setGameState] = createSignal<GameState>(GameState.Lobby);

    const [now, setNow] = createSignal(Math.floor(Date.now() / 1000));
    let intervalId: number = 0;
    onMount(() => {
        intervalId = setInterval(
            () => setNow(Math.floor(Date.now() / 1000)),
            1000
        );
    });
    onCleanup(() => {
        clearInterval(intervalId);
    });

    const handlers: Record<string, (data: any) => void> = {
        [MessageType.Join]: (data) => {
            if (users.some((user) => user.id === data.user_id)) return;
            setUsers(users.length, {
                id: data.user_id,
                name: data.content,
                answer: "",
                online: true,
                vote: "",
                host: data.host || false,
            });
        },
        [MessageType.Leave]: (data) => {
            setUsers((users) => users.filter((u) => u.id !== data.user_id));
        },
        [MessageType.GameDelete]: (data) => {
            setGameState(GameState.Deleted);
            setUsers([]);
            setQuestion("");
            setActualQuestion("");
        },
        [MessageType.UserStatus]: (data) => {
            setUsers(
                (user) => user.id === data.user_id,
                "online",
                data.content
            );
        },
        [MessageType.Init]: (data) => {
            setUsers(
                data.content.users.map((u: any) => ({
                    id: parseUUID(u.id),
                    name: u.name,
                    online: u.active,
                    host: u.host || false,
                }))
            );
            setGameState(data.content.game_state);
            setQuestion(data.content.question);
            setAnswersEndTime(data.content.answers_end_time);
            setVotingEndTime(data.content.voting_end_time);
            setActualQuestion(data.content.actual_question);
            data.content.answers.forEach((a: any) => {
                setUsers(
                    (user) => user.id === parseUUID(a.user_id),
                    "answer",
                    a.answer
                );
            });
        },
        [MessageType.UpdateUser]: (data) => {
            setUsers(
                (user) => user.id === data.user_id,
                "name",
                data.content.name
            );
        },
        [MessageType.Question]: (data) => {
            setQuestion(data.content.question);
            setAnswersEndTime(data.content.answers_end_time);
            setGameState(GameState.Answering);
        },
        [MessageType.Answers]: (data) => {
            data.content.answers.forEach((a: any) => {
                setUsers(
                    (user) => user.id === parseUUID(a.user_id),
                    "answer",
                    a.answer
                );
            });
            setActualQuestion(data.content.actual_question);
            setGameState(GameState.Voting);
            setVotingEndTime(data.content.voting_end_time);
            setVotedUser(users[0].id || null);
        },
        [MessageType.VoteResult]: (data) => {
            setGameState(GameState.Finished);
            setUsers((users) =>
                users.map((user) => {
                    const votedFor = data.content[user.id];
                    return { ...user, vote: votedFor || "" };
                })
            );
        },
    };

    const ws = createReconnectingWS(
        `https://3000--main--oddoneout-frontend--greenman999.coder.greenman999.de/api/games/${gameID}`
    );
    const state = createWSState(ws);
    const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];

    ws.addEventListener("message", (msg) => {
        const data = parseMessage(msg.data);

        handlers[data.type]?.(data);
    });

    const [linkCopied, setLinkCopied] = createSignal(false);

    const remainingTime = () => {
        if (gameState() === GameState.Answering && answersEndTime() !== null) {
            return Math.max(0, answersEndTime()! - now());
        } else if (
            gameState() === GameState.Voting &&
            votingEndTime() !== null
        ) {
            return Math.max(0, votingEndTime()! - now());
        }
        return 0;
    };

    const maxTime = () => {
        if (gameState() === GameState.Answering && answersEndTime() !== null) {
            return 60;
        } else if (
            gameState() === GameState.Voting &&
            votingEndTime() !== null
        ) {
            return 30;
        }
        return 60; // Default max time if not in answering or voting state
    };

    const [votedUser, setVotedUser] = createSignal<string | null>(null);

    return (
        <>
            <div class="flex flex-row justify-between items-center pt-4">
                <h1 class="text-4xl font-bold">OddOneOut</h1>
                <div class="flex flex-row items-center gap-4">
                    <span class="text-lg font-semibold">ID: {gameID}</span>
                    <button
                        class="btn btn-secondary"
                        onClick={() => {
                            const link = `${window.location.origin}/join/${gameID}`;
                            navigator.clipboard.writeText(link).then(() => {
                                setLinkCopied(true);
                                setTimeout(() => {
                                    setLinkCopied(false);
                                }, 1000);
                            });
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faLink}
                            title="Copy Invite Link"
                        />
                        {linkCopied() ? "Copied!" : "Invite"}
                    </button>
                </div>
            </div>
            <div class="card bg-base-200 mt-4">
                <div class="card-body">
                    <div class="flex flex-row items-center gap-4">
                <span class="text-xl whitespace-nowrap">
                    {
                        {
                            [GameState.Lobby]: "Lobby",
                            [GameState.Answering]: "Answering",
                            [GameState.Voting]: "Voting",
                            [GameState.Finished]: "Finished",
                            [GameState.Deleted]: "Deleted",
                        }[gameState()]
                    }
                </span>
                <progress
                    class="progress progress-accent h-4"
                    value={remainingTime()}
                    max={maxTime()}
                ></progress>
                        <span class="font-normal text-xl whitespace-nowrap">
                            {gameState() === GameState.Lobby
                                ? "Waiting for players..."
                                : remainingTime() + "s"}
                        </span>
                    </div>
                </div>
            </div>
            <Show when={gameState() === GameState.Answering}>
                <div class="card bg-base-200 mt-4">
                    <div class="card-body">
                        <span class="text-base">
                            Please answer the question below within the time
                            limit.
                        </span>
                        <h2 class="text-2xl font-semibold">{question()}</h2>
            <AnswerInput
                ws={ws}
                enabled={
                    gameState() === GameState.Answering &&
                    answersEndTime() !== null &&
                    now() < answersEndTime()!
                }
            />
                    </div>
                </div>
            </Show>
            <Show when={gameState() === GameState.Voting}>
                <div class="card bg-base-200 mt-4">
                    <div class="card-body">
                        <p class="text-xl font-semibold">
                            Vote for the player who you think is the odd one out
                            and has not answered the following question.
                        </p>
                        <h2 class="text-lg font-normal">
                            <span class="font-semibold">Actual Question: </span>
                            {actualQuestion()}
                        </h2>
                    </div>
                </div>
            </Show>
            <div class="mt-4 bg-base-200 card">
                <div class="card-body">
                    <div class="flex flex-row justify-between items-center mb-2">
                        <h3 class="text-xl font-semibold leading-none">
                            Players
                        </h3>
                        <div class="flex flex-row items-center gap-2">
                            <FontAwesomeIcon
                                icon={faUsers}
                                title="Player count"
                            ></FontAwesomeIcon>
                            {users.length} / 10
                        </div>
                    </div>
                    <For each={users}>
                        {(user) => (
                            <div
                                class={`card bg-base-300 ${
                                    votedUser() === user.id
                                        ? "outline-3 outline-primary"
                                        : ""
                                }`}
                                onClick={() => {
                                    if (
                                        gameState() === GameState.Voting &&
                                        votingEndTime() !== null &&
                                        now() < votingEndTime()!
                                    ) {
                                        setVotedUser(user.id);
                                    }
                                }}
                            >
                                <div class="p-4 flex flex-row items-center gap-4">
                                    <div
                                        class={`avatar ${
                                            user.online
                                                ? "avatar-online"
                                                : "avatar-offline"
                                        }`}
                                    >
                                        <div class="w-12 rounded-xl">
                                            <img
                                                src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${user.id}`}
                                            />
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <span class="text-lg">
                                            {user.name}
                                            {user.host ? " (Host)" : ""}
                                        </span>
                                        <Show
                                            when={
                                                gameState() ===
                                                    GameState.Answering ||
                                                gameState() ===
                                                    GameState.Voting ||
                                                gameState() ===
                                                    GameState.Finished
                                            }
                                        >
                                            <span class="text-sm text-gray-500">
                                                {user.answer || "No answer yet"}
                                            </span>
                                        </Show>
                                    </div>
                                    <div class=""></div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </>
    );
};

const AnswerInput: Component<{ ws: WebSocket; enabled: boolean }> = (props) => {
    const [answer, setAnswer] = createSignal("");
    const submitAnswer = (e: Event) => {
        e.preventDefault();
        if (!props.enabled) return;
        props.ws.send(
            JSON.stringify({
                type: "answer",
                content: answer(),
            })
        );
        setAnswer("");
    };
    return (
        <form onSubmit={submitAnswer} class="flex flex-row gap-2 my-4">
            <input
                class="input input-bordered flex-1"
                type="text"
                value={answer()}
                onInput={(e) => setAnswer(e.currentTarget.value)}
                placeholder="Your answer..."
                required
                disabled={!props.enabled}
            />
            <button
                class="btn btn-primary"
                type="submit"
                disabled={!props.enabled}
            >
                Submit Answer
            </button>
        </form>
    );
};

export default Game;

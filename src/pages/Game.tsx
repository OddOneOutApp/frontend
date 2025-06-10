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
} from "solid-js";
import { createStore } from "solid-js/store";

type User = {
    id: string;
    name: string;
    answer: string;
    online: boolean;
    vote: string;
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
    const [answers, setAnswers] = createStore<Record<string, string>>({});
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
            });
        },
        [MessageType.Leave]: (data) => {
            setUsers((users) => users.filter((u) => u.id !== data.user_id));
        },
        [MessageType.GameDelete]: (data) => {
            setGameState(GameState.Deleted);
            setUsers([]);
            setQuestion("");
            setAnswers({});
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
                    answer: u.answer,
                    online: u.active,
                }))
            );
            setGameState(data.content.game_state);
            setQuestion(data.content.question);
            setAnswersEndTime(data.content.answers_end_time);
            setVotingEndTime(data.content.voting_end_time);
            setActualQuestion(data.content.actual_question);
            setAnswers(
                Object.fromEntries(
                    data.content.answers.map((a: any) => [
                        parseUUID(a.user_id),
                        a.answer,
                    ])
                )
            );
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
            setAnswers(
                Object.fromEntries(
                    data.content.answers.map((a: any) => [
                        parseUUID(a.user_id),
                        a.answer,
                    ])
                )
            );
            setActualQuestion(data.content.actual_question);
            setGameState(GameState.Voting);
            setVotingEndTime(data.content.voting_end_time);
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

    return (
        <>
            <p class="text-sm">
                Connection: {states[state()]} ({ws.readyState})
            </p>
            <h1 class="text-2xl font-bold">Game ID: {gameID}</h1>
            <button
                class="btn btn-primary"
                onclick={() =>
                    ws.send(JSON.stringify({ type: "start", content: 60 }))
                }
            >
                Start Game
            </button>
            <h2 class="text-xl font-bold">Game State: {gameState()}</h2>
            <h2 class="text-xl font-bold">
                Answers End Time:{" "}
                {answersEndTime() !== null && answersEndTime() != 0
                    ? answersEndTime()! - now()
                    : "N/A"}
            </h2>
            <h2 class="text-xl font-bold">
                Voting End Time:{" "}
                {votingEndTime() !== null && votingEndTime() != 0
                    ? votingEndTime()! - now()
                    : "N/A"}
            </h2>
            <h2 class="text-xl font-bold">Question: {question()}</h2>
            <h2 class="text-xl font-bold">
                Actual Question: {actualQuestion()}
            </h2>
            <AnswerInput
                ws={ws}
                enabled={gameState() === GameState.Answering}
            />
            <h2 class="text-xl font-bold">Answers:</h2>
            <div class="flex flex-col gap-4">
                <For
                    each={Object.entries(answers)}
                    fallback={<p>Loading...</p>}
                >
                    {([userID, answer]) => (
                        <div class="card w-md bg-base-200 card-md shadow-sm items-center">
                            <div class="card-body">
                                <h2
                                    class="card-title
                                    text-lg font-bold"
                                >
                                    {userID}
                                </h2>
                                <p>{answer}</p>
                            </div>
                        </div>
                    )}
                </For>
            </div>
            <h2 class="text-xl font-bold">Users:</h2>
            <div class="flex flex-col gap-4">
                <For each={users} fallback={<p>Loading...</p>}>
                    {(user) => (
                        <div class="card w-md bg-base-200 card-md shadow-sm items-center">
                            <div class="card-body">
                                <div class="flex flex-row gap-2 items-center">
                                    <div
                                        class={`avatar ${
                                            user.online
                                                ? "avatar-online"
                                                : "avatar-offline"
                                        }`}
                                    >
                                        <div class="w-12 rounded-full">
                                            <img
                                                src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${user.id}`}
                                            />
                                        </div>
                                    </div>
                                    <h2
                                        class="card-title
                                        text-lg font-bold"
                                    >
                                        {user.name}
                                    </h2>
                                    <p>{user.id}</p>
                                    <p>{user.answer}</p>
                                    <p>{user.vote}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>

            {/* <p>Connection: {states[state()]}</p>
            <div class="flex flex-col gap-4">
                <For each={users} fallback={<p>Loading...</p>}>
                    {(user) => (
                        <div class="card w-md bg-base-200 card-md shadow-sm items-center">
                            <div class="card-body">
                                <div class="flex flex-row gap-2 items-center">
                                    <div
                                        class={`avatar ${
                                            user.online
                                                ? "avatar-online"
                                                : "avatar-offline"
                                        }`}
                                    >
                                        <div class="w-12 rounded-full">
                                            <img
                                                src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${user.id}`}
                                            />
                                        </div>
                                    </div>
                                    <h2 class="card-title">{user.name}</h2>
                                    <p>{user.id}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div> */}
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
                Submit
            </button>
        </form>
    );
};

export default Game;

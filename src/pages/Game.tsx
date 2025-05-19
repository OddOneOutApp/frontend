import {
    createReconnectingWS,
    createWSState,
} from "@solid-primitives/websocket";
import { useParams, RouteSectionProps } from "@solidjs/router";
import { createEffect, on, Component, For } from "solid-js";
import { createStore } from "solid-js/store";

const Game: Component<RouteSectionProps> = (props) => {
    const [users, setUsers] = createStore<User[]>([]);

    type User = {
        id: string;
        name: string;
        answer: string;
        online: boolean;
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

    const params = useParams();

    const ws = createReconnectingWS(
        `https://3000--main--oddoneout-frontend--greenman999.coder.greenman999.de/api/games/${params.gameID}`
    );
    const state = createWSState(ws);
    const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];

    ws.addEventListener("message", (msg) => {
        const data = parseMessage(msg.data);

        if (data.type === "join") {
            if (users.some((user) => user.id === data.user_id)) return;
            setUsers((users) => [
                ...users,
                {
                    id: data.user_id,
                    name: data.content,
                    answer: "",
                    online: true,
                },
            ]);
        } else if (data.type === "init") {
            setUsers((users) => {
                let newUsers = [];
                for (let i = 0; i < data.content.length; i++) {
                    newUsers.push({
                        id: parseUUID(data.content[i].id),
                        name: data.content[i].name,
                        answer: data.content[i].answer,
                        online: data.content[i].active,
                    });
                }
                return newUsers;
            });
        } else if (data.type === "leave") {
            setUsers((users) =>
                users.filter((user) => user.id !== data.user_id)
            );
        } else if (data.type === "user_status") {
            setUsers(
                (user, i) => user.id === data.user_id,
                "online",
                data.content
            );
        }
    });

    return (
        <>
            <p>Connection: {states[state()]}</p>
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
            </div>
        </>
    );
};

export default Game;

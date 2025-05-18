import {
    createReconnectingWS,
    createWSState,
} from "@solid-primitives/websocket";
import { useParams, RouteSectionProps } from "@solidjs/router";
import { createEffect, on, Component } from "solid-js";

const Game: Component<RouteSectionProps> = (props) => {
    const params = useParams();

    const ws = createReconnectingWS(
        `https://3000--main--oddoneout-frontend--greenman999.coder.greenman999.de/api/games/${params.gameID}`
    );
    const state = createWSState(ws);
    const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];

    ws.addEventListener("message", (msg) => {
        console.log("Message from server ", msg.data);
    });

    return (
        <>
            <p>Connection: {states[state()]}</p>
        </>
    );
};

export default Game;

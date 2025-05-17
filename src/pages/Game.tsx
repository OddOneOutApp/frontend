import {
    createReconnectingWS,
    createWS,
    createWSState,
    makeHeartbeatWS,
    makeReconnectingWS,
} from "@solid-primitives/websocket";
import { useParams, RouteSectionProps } from "@solidjs/router";
import { createEffect, on, Component } from "solid-js";

const Game: Component<RouteSectionProps> = (props) => {
    const params = useParams();

    createEffect(() => {
        const ws = new WebSocket(
            `wss://3000--main--oddoneout-frontend--greenman999.coder.greenman999.de/api/games/${params.gameID}`
        );
        ws.onmessage = (msg) => {
            console.log(msg);
            console.log("Message from server ", msg.data);
        };
        ws.onopen = () => {
            console.log("Connected to server");
            ws.send("Hello from client");
        };
        ws.onclose = () => {
            console.log("Disconnected from server");
        };
        ws.onerror = (error) => {
            console.error("WebSocket error: ", error);
        };
    });

    /* console.log(params.gameID);

    const ws = createReconnectingWS(
        `wss://3000--main--oddoneout-backend--greenman999.coder.greenman999.de/api/games/${params.gameID}`
    );
    const state = createWSState(ws);
    const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];
    ws.send("it works");

    ws.addEventListener("message", (msg) => console.log(msg)); */

    return <>{/* <p>Connection: {states[state()]}</p> */}</>;
};

export default Game;

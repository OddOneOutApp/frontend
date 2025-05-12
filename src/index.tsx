/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./pages/App.tsx";
import { Route, Router } from "@solidjs/router";
import RootLayout from "./layouts/RootLayout.tsx";
import AppLayout from "./layouts/AppLayout.tsx";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
    );
}

render(
    () => (
        <Router root={RootLayout}>
            <Route path="/" component={AppLayout}>
                <Route path="/" component={App} />
            </Route>
        </Router>
    ),
    root!
);

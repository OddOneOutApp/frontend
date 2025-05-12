import { RouteSectionProps } from "@solidjs/router";
import { Component } from "solid-js";

const AppLayout: Component<RouteSectionProps<unknown>> = (props) => {
    return <>{props.children}</>;
};

export default AppLayout;

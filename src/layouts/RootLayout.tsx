import AlertCard from "@/components/AlertCard.tsx";
import alertManager from "@/util/alerts.ts";
import { RouteSectionProps } from "@solidjs/router";
import { Component, For, JSX, Suspense } from "solid-js";

const RootLayout: Component<RouteSectionProps<unknown>> = (props) => {
    return (
        <>
            <div class="flex justify-center px-4 sm:px-6 lg:px-8">
                <div class="max-w-4xl w-full h-dvh">
                    <Suspense
                        fallback={
                            <div class="flex justify-center items-center h-dvh">
                                <span class="loading loading-spinner loading-lg"></span>
                            </div>
                        }
                    >
                        {props.children}
                    </Suspense>
                </div>
                <div class="toast toast-end z-50 mb-16">
                    <For each={alertManager.getAlerts()}>
                        {(alert) => <AlertCard alert={alert} />}
                    </For>
                </div>
            </div>
        </>
    );
};

export default RootLayout;

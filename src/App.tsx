import type { Component } from "solid-js";

const App: Component = () => {
    return (
        <div class="hero bg-base-200 min-h-screen">
            <div class="hero-content text-center">
                <div class="max-w-md flex flex-col items-center">
                    <h1 class="text-5xl font-bold">OddOneOut</h1>
                    <p class="py-6">
                        A fun party game where you have to find the odd one out!
                    </p>
                    <div class="flex gap-4 flex-row">
                        <button class="btn btn-primary">Create game</button>
                        <button class="btn btn-secondary">Join game</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;

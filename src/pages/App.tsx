import { createGame, fetchCategories, joinGame } from "@/api/gameApi.ts";
import ErrorFallback from "@/components/ErrorFallback.tsx";
import type { Component } from "solid-js";
import {
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Show,
    Suspense,
} from "solid-js";

const App: Component = () => {
    const [username, setUsername] = createSignal("");
    const isUsernameValid = () =>
        /^[A-Za-z][A-Za-z0-9\-]{2,29}$/.test(username());

    const [selectedCategory, setSelectedCategory] = createSignal("");
    const isCategorySelected = () => selectedCategory() !== "";
    const isFormValid = () => isUsernameValid() && isCategorySelected();

    const [gameId, setGameId] = createSignal("");

    const [categories, { refetch }] = createResource(fetchCategories);

    return (
        <div class="hero bg-base-100 min-h-screen">
            <div class="hero-content text-center">
                <div class="max-w-md flex flex-col items-center">
                    <h1 class="text-5xl font-bold">OddOneOut</h1>
                    <p class="py-6">
                        A fun party game where you have to find the odd one out!
                    </p>
                </div>
                <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
                    <legend class="fieldset-legend">Launch</legend>

                    <ErrorBoundary
                        fallback={(err, reset) => (
                            <ErrorFallback
                                err={err}
                                reset={reset}
                                refetch={refetch}
                            />
                        )}
                    >
                        <label class="label">Username</label>

                        <label class="input validator">
                            <svg
                                class="h-[1em] opacity-50"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <g
                                    stroke-linejoin="round"
                                    stroke-linecap="round"
                                    stroke-width="2.5"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </g>
                            </svg>
                            <input
                                type="text"
                                required
                                placeholder="Username"
                                pattern="[A-Za-z][A-Za-z0-9\-]*"
                                minlength="3"
                                maxlength="30"
                                title="Only letters, numbers or dash"
                                onInput={(e) =>
                                    setUsername(e.currentTarget.value)
                                }
                            />
                        </label>
                        <label class="label">Category</label>
                        <Suspense
                            fallback={
                                <select class="select">
                                    <option disabled selected value="">
                                        Loading...
                                    </option>
                                </select>
                            }
                        >
                            <select
                                class="select"
                                onChange={(e) =>
                                    setSelectedCategory(e.currentTarget.value)
                                }
                            >
                                <Show when={categories()}>
                                    <option disabled selected value="">
                                        Pick a category
                                    </option>
                                </Show>
                                <For
                                    each={categories()}
                                    fallback={
                                        <option disabled selected value="">
                                            There are no categories
                                        </option>
                                    }
                                >
                                    {(category) => (
                                        <option value={category}>
                                            {category}
                                        </option>
                                    )}
                                </For>
                            </select>
                        </Suspense>
                        <p class="label">Required only when creating a game</p>
                        <div class="flex flex-row gap-4">
                            <button
                                class="btn btn-primary mt-4 flex-1"
                                disabled={!isFormValid()}
                                onclick={async (e) => {
                                    const gameId = await createGame(
                                        username(),
                                        selectedCategory()
                                    );

                                    document.location.href = `/game/${gameId}`;
                                }}
                            >
                                Create a game
                            </button>
                            <button
                                class="btn btn-neutral mt-4 flex-1"
                                disabled={!isUsernameValid()}
                                onclick={(e) => {
                                    e.preventDefault();
                                    const dialog = document.getElementById(
                                        "game_id"
                                    ) as HTMLDialogElement;
                                    dialog.showModal();
                                }}
                            >
                                Join a game
                            </button>
                        </div>
                    </ErrorBoundary>
                </fieldset>
                <dialog id="game_id" class="modal">
                    <div class="modal-box w-xs">
                        <form method="dialog">
                            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                ✕
                            </button>
                        </form>
                        <h3 class="font-bold text-lg mb-4">Join a game</h3>

                        <div class="join">
                            <label class="input validator join-item">
                                <svg
                                    class="h-[1em] opacity-50"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M3.54944 12L3.21611 15H5.22841L5.56175 12H9.54944L9.21611 15H11.2284L11.5617 12H14.5552L14.7774 10H11.784L12.2284 6H15.2218L15.4441 4H12.4506L12.784 1H10.7717L10.4383 4H6.45064L6.78397 1H4.77166L4.43833 4H1.44431L1.22209 6H4.21611L3.77166 10H0.777642L0.55542 12H3.54944ZM5.78397 10H9.77166L10.2161 6H6.22841L5.78397 10Z"
                                        fill="currentColor"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    class="grow"
                                    id="game_id_input"
                                    placeholder="Game ID"
                                    required
                                    pattern="[a-zA-Z0-9]*"
                                    minlength="4"
                                    maxlength="4"
                                    title="Only letters and numbers"
                                    onInput={(e) =>
                                        setGameId(e.currentTarget.value)
                                    }
                                />
                            </label>
                            <button
                                class="btn btn-primary join-item"
                                onclick={async (e) => {
                                    await joinGame(gameId(), username());
                                    document.location.href = `/game/${gameId()}`;
                                }}
                                disabled={gameId() == ""}
                            >
                                Join
                            </button>
                        </div>
                    </div>

                    <form method="dialog" class="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>
            </div>
        </div>
    );
};

export default App;

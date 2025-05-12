import { sendApiRequest } from "./api.ts";

export const fetchCategories = async () => {
    const response: { categories: string[] } = await sendApiRequest(
        "/api/categories",
        "GET",
        false
    );
    return response.categories;
};

export const createGame = async (username: string, category: string) => {
    const response = await sendApiRequest("/api/games", "POST", true, {
        username,
        category,
    });
    return response.game_id;
};

export const joinGame = async (gameId: string, username: string) => {
    const response = await sendApiRequest(
        `/api/games/${gameId}/join`,
        "POST",
        true,
        { username }
    );
    return response.game_id;
};

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    plugins: [tailwindcss(), solidPlugin()],
    server: {
        port: 3000,
        allowedHosts: [
            "3000--main--oddoneout-frontend--greenman999.coder.greenman999.de",
        ],
        proxy: {
            "/api": {
                target: "https://8080--main--oddoneout-backend--greenman999.coder.greenman999.de",
                changeOrigin: true,
                secure: true,
            },
        },
    },
    build: {
        target: "esnext",
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@pages": path.resolve(__dirname, "src/pages"),
            "@util": path.resolve(__dirname, "src/util"),
            "@api": path.resolve(__dirname, "src/api"),
        },
    },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        // FastAPI sert ce dossier : voir backend/app/main.py
        outDir: 'dist',
        emptyOutDir: true
    },
    server: {
        port: 5173,
        // En développement, React tourne sur 5173 et l'API sur 8000.
        // Le proxy évite d'avoir à gérer le CORS dans ce cas.
        proxy: {
            '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true }
        }
    }
});

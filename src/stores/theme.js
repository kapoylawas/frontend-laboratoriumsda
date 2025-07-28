// Import create dari zustand
import { create } from 'zustand';

export const useStore = create((set) => ({
    // State
    theme: localStorage.getItem('theme') || 'light',

    // Action
    changeTheme: () => {

        set((state) => {

            // Get new theme
            const newTheme = state.theme === 'light' ? 'dark' : 'light';

            // Set new theme to local storage
            localStorage.setItem('theme', newTheme);

            // Set new theme to document element
            document.documentElement.setAttribute('data-bs-theme', newTheme);

            // Return new state
            return { theme: newTheme };
        });
    },
}))
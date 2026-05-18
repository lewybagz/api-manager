import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_RECENT_ITEMS = 5;

export interface RecentItem {
  id: string;
  name: string;
  type: "credential" | "file" | "project";
}

interface RecentItemsState {
  addRecentItem: (item: RecentItem) => void;
  items: RecentItem[];
}

const useRecentItemsStore = create<RecentItemsState>()(
  persist(
    (set) => ({
      addRecentItem: (newItem) =>
        { set((state) => {
          // Remove any existing item with the same ID
          const filteredItems = state.items.filter(
            (item) => item.id !== newItem.id
          );

          // Add the new item to the top of the list
          const updatedItems = [newItem, ...filteredItems];

          // Limit the list to the max number of items
          if (updatedItems.length > MAX_RECENT_ITEMS) {
            updatedItems.pop();
          }

          return { items: updatedItems };
        }); },
      items: [],
    }),
    {
      name: "recent-items-storage", // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
    }
  )
);

export default useRecentItemsStore; 
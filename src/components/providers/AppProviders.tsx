import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create query client with optimized defaults for desktop app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh longer for desktop
      gcTime: 10 * 60 * 1000, // 10 minutes cache time (renamed from cacheTime)
      retry: (failureCount, error) => {
        // Custom retry logic for database errors
        if (error instanceof Error && error.message.includes("Database")) {
          return false; // Don't retry database errors
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Desktop app doesn't need window focus refetch
      refetchOnReconnect: false, // SQLite doesn't have network issues
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
};

export { queryClient };

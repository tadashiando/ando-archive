import { useEffect, useState } from "react";
import { db } from "./database";
import MainLayout from "./components/Layout/MainLayout";

function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await db.init();
        setIsDbReady(true);
        console.log("Database initialized successfully!");
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    initDb();
  }, []);

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-stone-200">Initializing Ando Archive...</p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}

export default App;

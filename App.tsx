import React, { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import TaskList from './components/TaskList';
import Analytics from './components/Analytics';
import { getProductivityDate, isBeforeDate, formatDateKey } from './utils/dateUtils';
import { getScoreForDate, saveScoreForDate, getTasksForDate, calculateScore } from './services/storageService';

const App: React.FC = () => {
  // State for the current "real-world" productivity date (changes at 3 AM)
  const [currentProductivityDate, setCurrentProductivityDate] = useState<string>(getProductivityDate());
  
  // State for the date user is currently viewing
  const [selectedDate, setSelectedDate] = useState<string>(getProductivityDate());
  
  // Dummy state to force re-renders of analytics/calendar when data changes
  const [dataVersion, setDataVersion] = useState(0);

  /**
   * Core Logic: Time Check
   * Runs every minute to check if we crossed the 3 AM threshold.
   */
  useEffect(() => {
    const checkTime = () => {
      const nowProductivityDate = getProductivityDate();
      if (nowProductivityDate !== currentProductivityDate) {
        // 1. Threshold Crossed!
        console.log(`3 AM Reset Triggered. New Date: ${nowProductivityDate}`);
        
        // 2. Finalize previous day score immediately
        const prevDate = currentProductivityDate;
        // Check if score exists, if not calculate and lock it in
        const existingScore = getScoreForDate(prevDate, true); 
        // Note: getScoreForDate with isPast=true automatically calculates and saves if missing.
        
        // 3. Update State
        setCurrentProductivityDate(nowProductivityDate);
        
        // 4. If the user was looking at the "active" day (which is now old), 
        // switch them to the new empty day? Or keep them on the old day (now locked)?
        // Requirement: "Reset the planner for the new day". 
        // This implies the default view is the new day.
        if (selectedDate === prevDate) {
          setSelectedDate(nowProductivityDate);
        }

        refreshData();
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentProductivityDate, selectedDate]);

  /**
   * Initial Load: Check for missing scores from days passed while app was closed.
   */
  useEffect(() => {
    // If we open the app and today is Jan 5, but last recorded score was Jan 1,
    // we need to backfill Jan 2, 3, 4.
    // Ideally, we just let the Calendar or Analytics component lazily load them,
    // but running a quick check on the *immediate* previous day ensures continuity.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const prevKey = formatDateKey(yesterday); // Approximate check
    if (isBeforeDate(prevKey, currentProductivityDate)) {
        getScoreForDate(prevKey, true);
    }
  }, [currentProductivityDate]);

  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  // Is the selected view locked? 
  // It is locked if the selected date is strictly before the current productivity date.
  const isLocked = isBeforeDate(selectedDate, currentProductivityDate);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      
      {/* Side Panel (Desktop: Left, Mobile: Top/Hidden logic usually, keeping simple split here) */}
      <div className="flex flex-col w-full md:w-80 h-auto md:h-full border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900 z-10">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <i className="fas fa-check-double text-blue-500"></i>
            Daily Focus
          </h1>
        </div>
        
        {/* Calendar Widget */}
        <div className="flex-1 overflow-y-auto">
          <Calendar 
            selectedDate={selectedDate} 
            productivityDate={currentProductivityDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Analytics Widget (at bottom of sidebar) */}
        <Analytics currentProductivityDate={currentProductivityDate} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative">
        <TaskList 
          key={selectedDate} // Force remount on date change to clear local state if any
          dateKey={selectedDate}
          isLocked={isLocked}
          onDataChange={refreshData}
        />
      </main>

    </div>
  );
};

export default App;

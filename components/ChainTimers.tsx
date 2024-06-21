"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlusCircle, Trash2, PlayCircle, PauseCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Timer {
  title: string;
  duration: number;
  remaining: number;
}

const ChainTimers: React.FC = () => {
  const [timers, setTimers] = useState<Timer[]>([{ title: 'Timer 1', duration: 60, remaining: 60 }]);
  const [activeTimer, setActiveTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const lastUpdateTime = useRef<number>(0);

  const playBeep = useCallback(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning && activeTimer < timers.length) {
      intervalId = setInterval(() => {
        const now = Date.now();
        if (now - lastUpdateTime.current >= 1000) {
          lastUpdateTime.current = now;
          setTimers(prevTimers => {
            const newTimers = [...prevTimers];
            if (newTimers[activeTimer].remaining > 0) {
              newTimers[activeTimer].remaining -= 1;
              if (newTimers[activeTimer].remaining === 0) {
                playBeep();
                if (activeTimer < timers.length - 1) {
                  setActiveTimer(prevActive => prevActive + 1);
                } else {
                  setIsRunning(false);
                }
              }
            }
            return newTimers;
          });
        }
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, activeTimer, timers.length, playBeep]);

  const addTimer = () => {
    setTimers(prev => [...prev, { title: `Timer ${prev.length + 1}`, duration: 60, remaining: 60 }]);
  };

  const removeTimer = (index: number) => {
    setTimers(prev => prev.filter((_, i) => i !== index));
    if (index <= activeTimer) {
      setActiveTimer(prev => Math.max(0, prev - 1));
    }
  };

  const updateDuration = (index: number, newDuration: number) => {
    setTimers(prev => prev.map((timer, i) => 
      i === index ? { ...timer, duration: newDuration, remaining: newDuration } : timer
    ));
  };

  const updateTitle = (index: number, newTitle: string) => {
    setTimers(prev => prev.map((timer, i) => 
      i === index ? { ...timer, title: newTitle } : timer
    ));
  };

  const toggleTimer = () => {
    setIsRunning(prev => !prev);
    lastUpdateTime.current = Date.now();
  };

  const resetTimers = () => {
    setTimers(prev => prev.map(timer => ({ ...timer, remaining: timer.duration })));
    setActiveTimer(0);
    setIsRunning(false);
    lastUpdateTime.current = 0;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (index: number): string => {
    if (index < activeTimer) return 'bg-red-100';
    if (index === activeTimer) return 'bg-green-100';
    return 'bg-blue-100';
  };

  return (
    <div className="p-4 max-w-md mx-auto relative">
      <h1 className="text-2xl font-bold mb-4">Chain Timers</h1>
      <div className="absolute left-10 top-14 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
      <div className="relative z-0">
        {timers.map((timer, index) => (
          <div key={index} className="mb-4 relative">
            <div className={`flex flex-col p-2 rounded-lg ${getTimerColor(index)} w-full`}>
              <Input
                type="text"
                value={timer.title}
                onChange={(e) => updateTitle(index, e.target.value)}
                className="mb-2 font-semibold"
                placeholder="Enter timer title"
              />
              <div className="flex items-center">
                <Input
                  type="number"
                  value={timer.duration}
                  onChange={(e) => updateDuration(index, parseInt(e.target.value))}
                  className="w-20 mr-2"
                />
                <span className="mr-2">{formatTime(timer.remaining)}</span>
                <Button variant="ghost" size="icon" onClick={() => removeTimer(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={addTimer} className="mr-2">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Timer
        </Button>
        <Button onClick={toggleTimer} className="mr-2">
          {isRunning ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={resetTimers}>Reset</Button>
      </div>
    </div>
  );
};

export default ChainTimers;
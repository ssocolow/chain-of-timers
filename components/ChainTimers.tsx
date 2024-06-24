"use client"

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React, { useState, useEffect, useCallback, useRef, act } from 'react';
import { PlusCircle, Trash2, PlayCircle, PauseCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Timer {
  title: string;
  duration: number;
  remaining: number;
}

const STORAGE_KEY = 'chainTimersState';

const ChainTimers: React.FC = () => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [activeTimer, setActiveTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const lastUpdateTime = useRef<number>(0);

  // Load timers from localStorage on initial render
  useEffect(() => {
    const storedTimers = localStorage.getItem(STORAGE_KEY);
    if (storedTimers) {
      setTimers(JSON.parse(storedTimers));
    } else {
      setTimers([{ title: 'Timer 1', duration: 60, remaining: 60 }]);
    }
  }, []);

  // Save timers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

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

  const startFrom = (index: number) => {
    setActiveTimer(index);
    setIsRunning(true);
  }

  const currentTimerSeconds = () : number => {
    if (timers.length === 0 || activeTimer < 0 || activeTimer >= timers.length) {
      return 0; // Return 100 if there are no timers or activeTimer is invalid
    }
    return timers[activeTimer].remaining;
  }

  const currentTimerProgress = () : number => {
    if (timers.length === 0 || activeTimer < 0 || activeTimer >= timers.length) {
      return 100; // Return 100 if there are no timers or activeTimer is invalid
    }

    return 100 * (timers[activeTimer].remaining / timers[activeTimer].duration)
  }

  const totalTimerProgress = () : number => {
    if (timers.length === 0 || activeTimer < 0 || activeTimer >= timers.length) {
      return 100; // Return 100 if there are no timers or activeTimer is invalid
    }

    let totalDur = 0;
    let totalRemain = 0;
    for (let timer of timers) {
      totalDur += timer.duration;
      totalRemain += timer.remaining;
    }
    return 100 * (totalRemain / totalDur)
  }

  const totalTimerSeconds = () : number => {
    if (timers.length === 0 || activeTimer < 0 || activeTimer >= timers.length) {
      return 0; // Return 100 if there are no timers or activeTimer is invalid
    }

    let totalRemain = 0;
    for (let timer of timers) {
      totalRemain += timer.remaining;
    }
    return totalRemain;
  }



  return (
    <div className="p-4 max-w-md mx-auto relative">

      <div className='flex justify-center'>
      <h1 className="text-3xl font-bold ml-4 mb-4">Chain Timers</h1>
      </div>

      <div className="flex space-x-8">
      <div className="relative z-0">

      <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
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
                <span className="font-mono mr-2">{formatTime(timer.remaining)}</span>

                <Button variant="ghost" size="icon" onClick={() => removeTimer(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" onClick={() => startFrom(index)}>
                  <PlayCircle></PlayCircle>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <Button onClick={addTimer} className="mr-2">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Timer
        </Button>
        <Button onClick={toggleTimer} className="mr-2">
          {isRunning ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={resetTimers}>Reset</Button>
      </div>


      <div className="flex justify-center">
      <div className="fixed right-20 mt-8">
      <div className="text-center mb-4"> <h1 className='text-2xl'>Current Timer</h1></div>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" size="20rem" value={currentTimerProgress()} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h1" component="div" color="text.secondary">
          {`${Math.round(currentTimerSeconds())}`}
        </Typography>
      </Box>
    </Box>
      </div>
      </div>

   <div className="flex justify-center">
      <div className="fixed left-20 mt-8">
      <div className="text-center mb-4"> <h1 className='text-2xl'>Total Timers</h1></div>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" size="20rem" value={totalTimerProgress()} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h1" component="div" color="text.secondary">
          {`${Math.round(totalTimerSeconds())}`}
        </Typography>
      </Box>
    </Box>
      </div>
      </div>

      </div>
    </div>
  );
};

export default ChainTimers;
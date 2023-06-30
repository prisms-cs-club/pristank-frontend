import { GameDisplay } from '@/game-display';
import { Tasker } from '@/utils/tasker';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { CompletedTask, ErrorTask, ExecutingTask } from './tasks';

export default function Loading({ tasker, allComplete }: { tasker: Tasker, allComplete: (value: GameDisplay) => void }) {
    const [tasks, setTasks] = useState<{ [name: string]: number }>({});  // completion states of all tasks
                                                                         // 0 for executing, 1 for completed, 2 for error
    function taskStart(name: string) {
        setTasks(tasks => {
            console.log(`\"${name}\" started`);
            return {
                ...tasks,
                [name]: 0
            }
        });
    }

    function taskComplete(name: string) {
        setTasks(tasks => {
            console.log(`\"${name}\" completed`);
            if(tasks[name] === 0) {
                return {
                    ...tasks,
                    [name]: 1
                }
            } else {
                return tasks;
            }
        });
    }

    function taskError(name: string, error: any) {
        setTasks(tasks => {
            console.error(`\"${name}\" had an error:\n${error}`);
            if(tasks[name] === 0) {
                return {
                    ...tasks,
                    [name]: 2
                }
            } else {
                return tasks;
            }
        });
    }

    useEffect(() => {
        (async () => {
            await tasker.start<GameDisplay>(taskStart, taskComplete, taskError).then(allComplete);
        })();
    });
    return (
        <div id="root" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <h1 style={{textAlign: 'center', alignSelf: 'center'}}>Loading...</h1>
            <div style={{margin: 'auto'}} id="task-panel">{
                Object.entries(tasks).map(([name, status]) => {
                    switch(status) {
                        case 0:
                            return <ExecutingTask key={name}>{name}</ExecutingTask>;
                        case 1:
                            return <CompletedTask key={name}>{name}</CompletedTask>;
                        case 2:
                            return <ErrorTask key={name}>{name}</ErrorTask>;
                    }
                })
            }</div>
            <div id="user-interaction"></div>
        </div>
    )
}
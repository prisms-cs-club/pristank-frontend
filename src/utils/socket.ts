export function sendCommand(command: string, socket: WebSocket, timer: number) {
    socket.send(Math.floor(timer) + " " + command);
}

export function sendAllCommands(commands: string[], socket: WebSocket, timer: number) {
    console.log(commands);
    for(const command of commands) {
        sendCommand(command, socket, timer);
    }
}
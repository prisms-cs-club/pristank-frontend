export function ExecutingTask({ children }: { children: string }) {
    return <p style={{color: 'gray'}}>{children}</p>
}

export function CompletedTask({ children }: { children: string }) {
    return <p style={{color: 'green'}}>{children}</p>
}

export function ErrorTask({ children }: { children: string }) {
    return <p style={{color: 'red'}}>{children}</p>
}
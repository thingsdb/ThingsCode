export const errStr = (err: unknown, fallback: string) => {
    const message = err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : fallback;
    return message;
};
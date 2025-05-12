interface ErrorFallbackProps {
    err: any;
    reset: () => void;
    refetch: () => void;
}

const ErrorFallback = ({ err, reset, refetch }: ErrorFallbackProps) => {
    return (
        <>
            <div class="flex justify-center items-center h-full gap-4">
                <p class="font-bold">{err?.message}</p>
                <button
                    class="btn btn-warning mr-4"
                    onClick={async () => {
                        await refetch();
                        await reset();
                    }}
                >
                    Retry
                </button>
            </div>
        </>
    );
};

export default ErrorFallback;

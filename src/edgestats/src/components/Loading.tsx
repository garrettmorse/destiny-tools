const Loading: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="mask-conic-from-25% mask-conic-to-25% w-16 h-16 border-4 relative rounded-full transform rotate-90 animate-spin" />
        <p className="mt-4 text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default Loading;

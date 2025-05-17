const Loading: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground animate-pulse-slow">Loading Guardian data...</p>
      </div>
    </div>
  );
};

export default Loading;
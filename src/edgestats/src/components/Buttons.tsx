interface ButtonProps {
  toggleMasterwork: (b: boolean) => void;
  masterwork: boolean;
  clearState: () => void;
  copyLink: () => void;
}

const Buttons: React.FC<ButtonProps> = ({
  clearState,
  copyLink,
  toggleMasterwork,
  masterwork,
}) => (
  <>
    <button
      id="copy-button"
      className="w-25 bg-green-500 hover:bg-gradient-to-b after:bg-yellow-400 active:hover:ring-1 active:scale-99 from-green-400 to-green-800 items-center transition-all duration-500 p-1 rounded"
      onClick={copyLink}
    >
      <span id="default-message">Create Link</span>
      <span id="success-message" className="hidden">
        <div className="inline-flex items-center">Link Copied!</div>
      </span>
    </button>
    <button
      className={`${
        masterwork
          ? "bg-yellow-500 hover:bg-gradient-to-l active:bg-gradient-to-r from-yellow-500 to-blue-500"
          : "bg-blue-500 hover:bg-gradient-to-l active:bg-gradient-to-r from-blue-500 to-yellow-500"
      } bg-size-200 hover:ring-1 active:scale-99 via-yellow items-center transition-all duration-500 p-1 rounded`}
      onClick={() => toggleMasterwork(!masterwork)}
    >
      Masterwork
    </button>
    <button
      className="bg-red-400 hover:bg-gradient-to-b hover:ring-1 active:scale-99 from-red-400 to-red-800 items-center transition-all duration-500 p-1 rounded"
      onClick={() => clearState()}
    >
      Reset Options
    </button>
  </>
);

export default Buttons;

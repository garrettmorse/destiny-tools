const emblemStyles: Record<string, React.CSSProperties> = {
  img: {
    display: "block",
  },
  thumbnail: {
    position: "relative",
    display: "inline-block",
  },
  username: {
    position: "absolute",
    top: "10%",
    left: "20%",
    textAlign: "left",
    color: "white",
    fontWeight: "bold",
  },
  light: {
    position: "absolute",
    top: "25%",
    left: "86.5%",
    transform: "translate( -50%, -50% )",
    textAlign: "center",
    color: "#ffeb3b",
  },
};

const Emblem: React.FC<{
  name: string;
  lightLevel: number | string;
  emblemUrl: string;
}> = ({ name, lightLevel, emblemUrl }) => {
  const textSize =
    name.length < 12
      ? "sm:text-2xl"
      : name.length < 20
      ? "sm:text-xl"
      : "sm:text-lg";
  const mobileTextSize =
    name.length < 12
      ? "max-sm:text-xl"
      : name.length < 20
      ? "max-sm:text-lg"
      : "max-sm:text-md";
  return (
    <div className="shadow-md" style={emblemStyles.thumbnail}>
      <img
        className="rounded"
        style={emblemStyles.img}
        /* @ts-expect-error cant figure out typing globalThis specifically for local dev with vite */
        src={`${global.BNET}/${emblemUrl}`}
      />
      <div
        className={`${mobileTextSize} ${textSize} text-left`}
        style={{ ...emblemStyles.username, width: 424 }}
      >
        <p>{name}</p>
      </div>
      <div className="max-sm:text-2xl sm:text-4xl" style={emblemStyles.light}>
        <p>✦{lightLevel ?? 0}</p>
      </div>
    </div>
  );
};

export default Emblem;

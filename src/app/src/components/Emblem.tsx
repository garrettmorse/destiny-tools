const emblemStyles: Record<string, React.CSSProperties> = {
  img: {
    display: 'block'
  },
  thumbnail: {
    position: 'relative',
    display: 'inline-block'
  },
  username: {
    position: 'absolute',
    top: '25%',
    left: '43.5%',
    transform: 'translate( -50%, -50% )',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  light: {
    position: 'absolute',
    top: '25%',
    left: '86.5%',
    transform: 'translate( -50%, -50% )',
    textAlign: 'center',
    color: '#ffeb3b',
  },
};

const Emblem: React.FC<{ name: string; lightLevel: number | string; emblemUrl: string; }> = ({ name, lightLevel, emblemUrl }) => (
  <div className="shadow-md" style={emblemStyles.thumbnail}>
    <img className="rounded" style={emblemStyles.img} src={`${global.BNET}/${emblemUrl}`} />
    <div className="text-lg" style={emblemStyles.username}>
      <p>{name}</p>
    </div>
    <div className="text-4xl"style={emblemStyles.light}>
      <p>✦{lightLevel ?? 0}</p>
    </div>
  </div>
);

export default Emblem;
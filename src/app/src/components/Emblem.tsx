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
    top: '10%',
    left: '20%',
    textAlign: 'left',
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

const Emblem: React.FC<{ name: string; lightLevel: number | string; emblemUrl: string; }> = ({ name, lightLevel, emblemUrl }) => { 
  const textSize = name.length < 12 ? '2xl' : name.length < 20 ? 'xl' : 'lg';
  return (
  <div className="shadow-md" style={emblemStyles.thumbnail}>
    <img className="rounded" style={emblemStyles.img} src={`${global.BNET}/${emblemUrl}`} />
    <div className={`text-${textSize} text-left`}  style={{...emblemStyles.username, width: 424 }}>
      <p>{name}</p>
    </div>
    <div className="text-4xl"style={emblemStyles.light}>
      <p>✦{lightLevel ?? 0}</p>
    </div>
  </div>
)};

export default Emblem;
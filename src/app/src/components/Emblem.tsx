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
    top: '35%',
    left: '50%',
    transform: 'translate( -50%, -50% )',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'lighter',
  }
};

const Emblem: React.FC<{ name: string; emblemUrl: string; }> = ({ name, emblemUrl }) => (
  <div style={emblemStyles.thumbnail}>
    <img style={emblemStyles.img} src={`${global.BNET}/${emblemUrl}`} />
    <div className="container text-2xl" style={emblemStyles.username}>
      <p>{name}</p>
    </div>
  </div>
);

export default Emblem;
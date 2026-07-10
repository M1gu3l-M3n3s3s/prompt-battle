interface Props {
  theme: string;
}

export default function ThemeDisplay({ theme }: Props) {
  return (
    <div className="bg-gradient-to-r from-primary-900/30 via-secondary-900/30 to-accent-900/30 border border-primary-800/30 rounded-2xl p-6 text-center animate-fade-in">
      <p className="text-sm text-gray-500 mb-2">Tema de la ronda</p>
      <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-secondary-300 to-accent-300">
        {theme}
      </h3>
    </div>
  );
}

export const metadata = {
  title: 'CYPHER - Drop Beats, Spit Bars',
  description: 'Hip hop beat sharing and rap recording app',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000' }}>
        {children}
      </body>
    </html>
  );
}

export default function Home({ videos }) {
  const latestTen = videos.videos.slice(0, 9);

  return (
    <div style={{ margin: '10px' }}>
      <h1>Videoita yhteensä: {videos.total}</h1>
      <h3>Viimeisimmät 10 videota</h3>
      {latestTen.map(({ file_id, url }) => (
        <div key={file_id} style={{ margin: '10px' }}>
          <a href={url} target='_blank'>
            Katso video
          </a>
        </div>
      ))}
    </div>
  );
}

export const getServerSideProps = async () => {
  const parseCookies = (response) => {
    const raw = response.headers.raw()['set-cookie'];
    return raw
      .map((entry) => {
        const parts = entry.split(';');
        const cookiePart = parts[0];
        return cookiePart;
      })
      .join(';');
  };

  const loginResponse = await fetch('https://ajax.streamable.com/check', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      password: process.env.STREAMABLE_PASSWORD,
      username: process.env.STREAMABLE_USERNAME,
    }),
  });

  const parsedCookies = parseCookies(loginResponse);

  const videosResponse = await fetch('https://ajax.streamable.com/videos', {
    method: 'GET',
    credentials: 'include',
    headers: {
      cookie: parsedCookies,
    },
  });

  const videos = await videosResponse.json();

  return {
    props: { videos },
  };
};

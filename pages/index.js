import styles from '../styles/index.module.css';

export default function Home({ videos }) {
  return (
    <div className={styles.wrapper}>
      <h1>Videoita yhteensä: {videos.total}</h1>
      <h3>Viimeisimmät 10 videota</h3>
      {videos.videos.map(
        ({ file_id, url, title, files, dynamic_thumbnail_url: poster }) => (
          <div key={file_id}>
            <h4>{title}</h4>
            <video
              controls
              controlsList='nodownload'
              width='720'
              poster={poster}
              preload='metadata'
            >
              {/* mp4-high is available after streamable has fully processed the video */}
              {files['mp4-high'].url && (
                <source
                  src={`https:${files['mp4-high'].url}`}
                  type='video/mp4'
                />
              )}
              <source src={`https:${files.mp4.url}`} type='video/mp4' />
              <p>
                Selaimesi ei tue embed videoita. Tässä
                <a
                  style={{ margin: '3px' }}
                  href={url}
                  target='_blank'
                  rel='noreferrer'
                >
                  linkki
                </a>
                videoon.
              </p>
            </video>
          </div>
        ),
      )}
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
    method: 'POST',
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

  // Only fetch latest 10 for now
  const videosResponse = await fetch(
    'https://ajax.streamable.com/videos?sort=date_added&sortd=DESC&count=10&page=1',
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        cookie: parsedCookies,
      },
    },
  );

  const videos = await videosResponse.json();

  return {
    props: { videos },
  };
};

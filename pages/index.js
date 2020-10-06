import Head from 'next/head';
import styles from '../styles/index.module.css';

export const getStaticProps = async () => {
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
    body: JSON.stringify({
      password: process.env.STREAMABLE_PASSWORD,
      username: process.env.STREAMABLE_USERNAME,
    }),
  });

  const parsedCookies = parseCookies(loginResponse);

  // Fetch latest 15 videos
  const videosResponse = await fetch(
    'https://ajax.streamable.com/videos?sort=date_added&sortd=DESC&count=15',
    {
      method: 'GET',
      headers: {
        cookie: parsedCookies,
      },
    },
  );

  // {total: 123, videos: [{}...]}
  const parsedVideosResponse = await videosResponse.json();

  // Take the latest 10 PUBLIC videos which streamable has finished processing
  // meaning they have file url
  const publicVideos = parsedVideosResponse.videos
    .filter(({ privacy, files }) => privacy === 0 && files.mp4.url)
    .slice(0, 10);

  return {
    props: {
      totalCount: parsedVideosResponse.total,
      videos: publicVideos,
    },
    // https://nextjs.org/docs/basic-features/data-fetching#incremental-static-regeneration
    revalidate: 60,
  };
};

export default function Home({ totalCount, videos }) {
  return (
    <div className={styles.wrapper}>
      <Head>
        <title>Topparin klipit</title>
        <meta
          name="description"
          content="Videoita hauskoista tilanteista ja hyvistä pelihetkistä"
          key="description"
        />
      </Head>

      <h1>Videoita yhteensä: {totalCount}</h1>
      <h2>Viimeisimmät 10 videota</h2>
      {videos.map(
        ({ file_id, url, title, files, dynamic_thumbnail_url: poster }) => (
          <div className={styles.videoWrapper} key={file_id}>
            <h3>{title}</h3>
            <video
              className={styles.video}
              controls
              controlsList="nodownload"
              poster={`https:${poster}`}
              preload="metadata"
            >
              {/* mp4-high is available after streamable has fully processed the video */}
              {files['mp4-high'] && (
                <source
                  src={`https:${files['mp4-high'].url}`}
                  type="video/mp4"
                />
              )}
              <source src={`https:${files.mp4.url}`} type="video/mp4" />
              <p>
                Selaimesi ei tue embed videoita. Tässä
                <a
                  style={{ margin: '3px' }}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
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

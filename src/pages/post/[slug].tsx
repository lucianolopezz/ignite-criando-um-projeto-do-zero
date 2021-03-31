import { GetStaticPaths, GetStaticProps } from 'next';

import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const readingTime = post?.data.content.reduce((acc, content) => {
    const text = `${content.heading} ${RichText.asText(content.body)}`;

    acc += Math.ceil(text.split(' ').length / 200);

    return acc;
  }, 0);

  if (router.isFallback)
    return <h1 className={styles.loading}>Carregando...</h1>;

  return (
    <div className={styles.container}>
      <header>
        <Header />
      </header>
      <figure>
        <img src={post?.data.banner.url} alt="banner" />
      </figure>
      <div className={styles.post}>
        <h1>{post?.data.title}</h1>
        <div className={commonStyles.postDescription}>
          <span>
            <FiCalendar />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBr,
            })}
          </span>
          <span>
            <FiUser />
            {post?.data.author}
          </span>
          <time>
            <FiClock /> {readingTime} min
          </time>
        </div>
        <article>
          {post?.data?.content.map((content, index) => (
            <div key={String(index)}>
              <h2>{content.heading}</h2>
              <div
                className={styles.content}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};

import { useState } from 'react';

import { GetStaticProps } from 'next';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination);

  function handlePagination(next_page: string) {
    fetch(next_page)
      .then(response => response.json())
      .then(result => {
        const post: Post = result.results[0];

        setPosts(prevState => ({
          next_page: result.next_page,
          results: [
            ...prevState.results,
            {
              uid: post.uid,
              first_publication_date: post.first_publication_date,
              data: post.data,
            },
          ],
        }));
      });
  }

  return (
    <div className={commonStyles.container}>
      <Header />
      {posts.results.map(post => (
        <div key={post.uid} className={styles.posts}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
              <h3>{post.data.subtitle}</h3>
            </a>
          </Link>
          <div className={commonStyles.postDescription}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBr,
              })}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
          </div>
        </div>
      ))}
      {posts.next_page && (
        <button
          type="button"
          className={styles.loadMorePosts}
          onClick={() => handlePagination(postsPagination.next_page)}
        >
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 24, // 24 hrs
  };
};

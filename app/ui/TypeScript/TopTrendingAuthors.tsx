// components/TopTrendingAuthors.tsx

import React from 'react';
import styles from '../CSS/TopTrendingAuthors.module.css';

interface Author {
  id: number;
  name: string;
}

interface Props {
  authors: Author[];
}

const TopTrendingAuthors: React.FC<Props> = ({ authors }) => {
  return (
    <div className={styles.container}>
      <ul>
        {authors.map(author => (
          <li key={author.id}>{author.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default TopTrendingAuthors;

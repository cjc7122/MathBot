// components/TopTrendingBooks.tsx

import React from 'react';
import styles from '../CSS/TopTrendingBooks.module.css'; // Import CSS module

interface Book {
  id: number;
  title: string;
}

interface Props {
  books: Book[];
}

const TopTrendingBooks: React.FC<Props> = ({ books }) => {
  return (
    <div className={styles.container}>
      <ul>
        {books.map(book => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default TopTrendingBooks;

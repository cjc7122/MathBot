// components/PostCard.tsx

import React from 'react';
import styles from '../CSS/PostCard.module.css';

interface Post {
  title: string;
  content: string;
  author: string;
  review: string;
  comments: { user: string; comment: string }[];
  likes: number;
}


interface PostCardProps {
  posts: Post[];
}

const PostCard: React.FC<PostCardProps> = ({ posts }) => {
  return (
    <div className={styles.postCardContainer}>
      {posts.map((post, index) => (
        <div key={index} className={styles.postCard}>
          <div className={styles.bookPicture}>
            {/* Add book picture here */}
          </div>
          <div className={styles.content}>
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.author}>Author: {post.author}</p>
            <p className={styles.review}>{post.review}</p>
            <div className={styles.comments}>
              {/* Render comments here */}
              {post.comments.map((comment, index) => (
                <div key={index} className={styles.comment}>
                  <p>{comment.user}: {comment.comment}</p>
                </div>
              ))}
            </div>
            <div className={styles.likeButton}>
              {/* Like button with count */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


export default PostCard;


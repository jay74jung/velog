// @flow
import React from 'react';
import type { PostSequence } from 'store/modules/posts';
import { convertToPlainText, fromNow } from 'lib/common';
import { Link } from 'react-router-dom';
import cx from 'classnames';

import './PostSequences.scss';

type PostSequenceItemProps = {
  sequence: PostSequence,
  username: string,
  active: boolean,
};

type Props = {
  sequences: ?(PostSequence[]),
  username: string,
  currentPostId: string,
};

const PostSequenceItem = ({ sequence, username, active }: PostSequenceItemProps) => {
  const { title, body, meta, url_slug, created_at } = sequence;
  return (
    <div className={cx('PostSequenceItem', { active })}>
      <div className="date">{fromNow(created_at)}</div>
      <div className="title">
        <Link to={`/@${username}/${url_slug}`}>{title}</Link>
      </div>
      <p>{(meta && meta.short_description) || body}</p>
    </div>
  );
};

const PostSequences = ({ sequences, username, currentPostId }: Props) => {
  if (!sequences || sequences.length === 0 || sequences.length === 1) return null;
  return (
    <div className="PostSequences">
      <div className="wrapper">
        <h3>{username}님이 작성한 다른 포스트</h3>
        {sequences.map(s => (
          <PostSequenceItem
            key={s.id}
            sequence={s}
            username={username}
            active={s.id === currentPostId}
          />
        ))}
      </div>
    </div>
  );
};

export default PostSequences;

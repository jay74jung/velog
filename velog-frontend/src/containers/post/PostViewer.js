// @flow
import React, { Component, Fragment } from 'react';
import PostHead from 'components/post/PostHead';
import PostContent from 'components/post/PostContent';
import PostTags from 'components/post/PostTags';
import { PostsActions, CommonActions } from 'store/actionCreators';
import { connect } from 'react-redux';
import type { State } from 'store';
import type { PostData, TocItem } from 'store/modules/posts';
import PostToc from 'components/post/PostToc';
import QuestionModal from 'components/common/QuestionModal/QuestionModal';
import { withRouter, type ContextRouter, type Location } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { convertToPlainText } from 'lib/common';
import PostPlaceholder from 'components/post/PostPlaceholder';
import throttle from 'lodash/throttle';

type Props = {
  username: ?string,
  urlSlug: ?string,
  post: ?PostData,
  toc: ?(TocItem[]),
  activeHeading: ?string,
  likeInProcess: boolean,
  currentUsername: ?string,
  askRemove: boolean,
  routerHistory: Location[],
  shouldCancel: boolean,
  logged: boolean,
} & ContextRouter;

class PostViewer extends Component<Props> {
  initialize = async () => {
    // set scroll to top
    if (document.body && document.body.scrollTop) {
      document.body.scrollTop = 0;
    }
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    const { username, urlSlug, shouldCancel } = this.props;
    if (!username || !urlSlug) return;
    try {
      if (shouldCancel) return;
      await PostsActions.readPost({
        username,
        urlSlug,
      });
      if (!this.props.post) return;
      const { id } = this.props.post;
      PostsActions.getSequences(id);
    } catch (e) {
      console.log(e);
      if (e && e.response && e.response.status === 404) {
        this.props.history.replace('/404');
      }
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.urlSlug !== this.props.urlSlug) {
      PostsActions.unloadPost();
      this.initialize();
    }
  }

  componentWillUnmount() {
    PostsActions.unloadPost();
  }

  onSetToc = (toc: ?(TocItem[])) => {
    PostsActions.setToc(toc);
  };

  onActivateHeading = throttle((headingId: string) => {
    PostsActions.activateHeading(headingId);
  }, 250);

  onToggleLike = () => {
    const { post, likeInProcess } = this.props;
    if (likeInProcess) return;
    if (!post) return;
    if (post.liked) {
      PostsActions.unlike(post.id);
    } else {
      PostsActions.like(post.id);
    }
  };

  onToggleAskRemove = () => {
    PostsActions.toggleAskRemove();
  };

  onConfirmRemove = async () => {
    const { post, history, routerHistory } = this.props;
    PostsActions.toggleAskRemove();
    if (!post) return;
    try {
      await CommonActions.removePost(post.id);
    } catch (e) {
      console.log(e);
    }
    if (routerHistory.length === 0) {
      history.push('/');
      return;
    }
    history.goBack();
  };

  componentDidMount() {
    this.initialize();
    const { hash } = this.props.location;
    if (hash !== '') {
      PostsActions.activateHeading(decodeURI(hash.split('#')[1]));
    }
  }

  render() {
    const { post, toc, activeHeading, username, currentUsername, askRemove, logged } = this.props;
    const { onSetToc, onActivateHeading } = this;
    if (!post) return <PostPlaceholder />;

    return (
      <Fragment>
        <Helmet>
          <title>{post.title}</title>
          <meta name="description" content={convertToPlainText(post.body)} />
          <link rel="canonical" href={`https://velog.io/@${post.user.username}/${post.url_slug}`} />
        </Helmet>
        <PostToc
          toc={toc}
          activeHeading={activeHeading}
          onActivateHeading={this.onActivateHeading}
        />
        <PostHead
          id={post.id}
          date={post.created_at}
          title={post.title}
          tags={post.tags}
          categories={post.categories}
          user={post.user}
          likes={post.likes}
          liked={post.liked}
          onToggleLike={this.onToggleLike}
          ownPost={currentUsername === username}
          onAskRemove={this.onToggleAskRemove}
          logged={logged}
        />
        <PostContent
          thumbnail={post.thumbnail}
          body={post.body}
          onSetToc={onSetToc}
          onActivateHeading={onActivateHeading}
          theme={post.meta.code_theme}
        />
        <PostTags tags={post.tags} />
        <QuestionModal
          open={askRemove}
          title="포스트 삭제"
          description="이 포스트를 정말로 삭제하시겠습니까?"
          confirmText="삭제"
          onConfirm={this.onConfirmRemove}
          onCancel={this.onToggleAskRemove}
        />
      </Fragment>
    );
  }
}

export default connect(
  ({ posts, pender, user, common }: State) => ({
    currentUsername: user.user && user.user.username,
    post: posts.post,
    toc: posts.toc,
    activeHeading: posts.activeHeading,
    likeInProcess: pender.pending['posts/LIKE'] || pender.pending['posts/UNLIKE'],
    askRemove: posts.askRemove,
    routerHistory: common.router.history,
    shouldCancel: common.ssr && !common.router.altered,
    logged: !!user.user,
  }),
  () => ({}),
)(withRouter(PostViewer));

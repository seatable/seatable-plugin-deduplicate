export const getImageThumbnailUrl = (url) => {
  let { server } = window.dtable;
  let isInternalLink = url.indexOf(server) > -1;
  if (isInternalLink) {
    let imageThumbnailUrl = url.replace('/workspace', '/thumbnail/workspace') + '?size=256';
    return imageThumbnailUrl;
  }
  return url;
};

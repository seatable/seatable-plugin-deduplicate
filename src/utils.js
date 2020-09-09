export const getImageThumbnailUrl = (url) => {
  let { server, thumbnailServer, accessToken } = window.dtable || {};
  let isInternalLink = url.indexOf(server) > -1; 
  if (isInternalLink) {
    if (thumbnailServer) {
      let imageThumbnailUrl = url.replace(server, thumbnailServer);
      imageThumbnailUrl = imageThumbnailUrl.replace('/workspace', '/thumbnail/workspace') + '?size=256&token=' + accessToken;
      return imageThumbnailUrl;
    }   
    else {
      let imageThumbnailUrl = url.replace('/workspace', '/thumbnail/workspace') + '?size=256';
      return imageThumbnailUrl;
    }   
  }
  return url;
};

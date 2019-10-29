const { sleep, createElement } = require('powercord/util');
const { Toast } = require('powercord/components');
const { React, ReactDOM, channels } = require('powercord/webpack');
const { desktopCapturer, webFrame } = require('electron');

module.exports = async function (position, options) {
  if (!position) {
    return false;
  }
  return new Promise(async (resolve, reject) => {
    const imageFormat = 'image/png';

    const zoomFactor = options.originalZoomFactor;

    desktopCapturer.getSources({ types: [ 'window', 'screen' ] }).then(async sources => {
      for (const source of sources) {
        if (source.name.includes(document.title)) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              cursor: 'never',
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: source.id,
                  minWidth: 1280,
                  maxWidth: 4000,
                  minHeight: 720,
                  maxHeight: 4000
                }
              }
            });

            // Create hidden video tag
            const video = document.createElement('video');
            video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
            // Event connected to stream
            video.onloadedmetadata = function () {
              video.style.height = `${this.videoHeight}px`;
              video.style.width = `${this.videoWidth}px`;

              video.play();

              const cropCanvas = (sourceCanvas, left, top, width, height) => {
                const destCanvas = document.createElement('canvas');
                destCanvas.width = width;
                destCanvas.height = height;
                destCanvas.getContext('2d').drawImage(
                  sourceCanvas,
                  left, top, width, height, // source rect with content to crop
                  0, 0, width, height); // newCanvas, same size as source rect
                return destCanvas;
              };

              // Create canvas
              const canvas = document.createElement('canvas');
              canvas.width = this.videoWidth;
              canvas.height = this.videoHeight;
              const ctx = canvas.getContext('2d');
              // Draw video on canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const isCompact = options.compact;
              const newCanvas = cropCanvas(
                canvas,
                position.left - (isCompact ? -10 : 75),
                position.top - (isCompact ? 5 : 25),
                position.width + (isCompact ? -10 : 75),
                position.height + (isCompact ? 5 : 25)
              );

              // Save screenshot as png and upload
              newCanvas.toBlob((blob) => {
                const container = createElement('div', { id: 'quotonic-popup' });
                document.body.appendChild(container);
                const Notification = React.createElement(Toast, {
                  header: React.createElement('div', null, 'Quote successful'),
                  style: {
                    bottom: '25px',
                    right: '25px',
                    display: 'block',
                    padding: '12px'
                  },
                  buttons: []
                });

                const render = async () => {
                  const NotificationRenderer = ReactDOM.render(Notification, container);
                  if (Notification && NotificationRenderer) {
                    await sleep(1000);
                    NotificationRenderer.setState({ leaving: true });
                    await sleep(500);
                  }
                  container.remove();
                };
                render();

                const file = new File([ blob ], `quotonic-${channels.getChannelId()}-${options.messageID}.png`);
                resolve(file);
              }, imageFormat);

              // Remove hidden video tag
              video.remove();

              try {
                // Destroy connect to stream
                stream.getTracks()[0].stop();
              } catch (e) {}
            };

            video.srcObject = stream;
            document.body.appendChild(video);
          } catch (e) {
            reject();
            this.error(e);
            powercord.pluginManager.get('pc-announcements').sendNotice({
              id: 'quotonic',
              message: 'Oh no, there was an error whilst taking the screenshot for the quote! Check the console for more details.',
              alwaysDisplay: true
            });
          } finally {
            webFrame.setZoomFactor(zoomFactor);
          }
        }
      }
    });
  });
};


const { sleep, createElement } = require('powercord/util');
const { Toast } = require('powercord/components');
const { React, ReactDOM, channels } = require('powercord/webpack');
const { webFrame, remote } = require('electron');

module.exports = async function (position, options) {
  const imageFormat = 'image/png';
  if (!position) {
    return false;
  }

  const getCanvasBlob = (canvas) => new Promise(((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, imageFormat);
  }));

  return new Promise(async (resolve, reject) => {
    const isCompact = options.compact;
    const zoomFactor = options.originalZoomFactor;

    try {
      let blob = null;
      const positioning = {
        x: position.left - (isCompact ? -10 : 75),
        y: position.top - (isCompact ? 5 : 25),
        width: position.width + (isCompact ? -10 : 75),
        height: position.height + (isCompact ? 5 : 25)
      };

      const win = remote.getCurrentWindow();
      const file = await win.capturePage(positioning).catch(console.error);

      // Save screenshot as png and upload
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

      const send = () => {
        blob = blob || new Blob([ file.toPNG({ scaleFactor: zoomFactor }) ], { type: imageFormat });
        const final = new File([ blob ], `quotonic-${channels.getChannelId()}-${options.messageID}.png`);
        resolve(final);
      };

      const size = file.getSize();
      if (size.height > (window.innerHeight * zoomFactor) || size.width > (window.innerWidth * zoomFactor)) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = file.toDataURL();
        img.onload = async () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const newCanvas = cropCanvas(
            canvas,
            positioning.x,
            positioning.y,
            positioning.width,
            positioning.height
          );

          blob = await getCanvasBlob(newCanvas);
          send();
        };
      } else {
        send();
      }
    } catch (e) {
      reject();
      this.error(e, e.message);
      powercord.pluginManager.get('pc-announcements').sendNotice({
        id: 'quotonic',
        message: 'Oh no, there was an error whilst taking the screenshot for the quote! Check the console for more details.',
        alwaysDisplay: true
      });
    } finally {
      webFrame.setZoomFactor(zoomFactor);
    }
  });
};


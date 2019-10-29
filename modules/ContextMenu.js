const { inject } = require('powercord/injector');
const { ContextMenu: { Submenu } } = require('powercord/components');
const { React, getModuleByDisplayName, getModule, channels } = require('powercord/webpack');

module.exports = async function () {
  const _this = this;
  const MessageContextMenu = await getModuleByDisplayName('MessageContextMenu');
  const upload = await getModule([ 'instantBatchUpload' ], false);

  inject('quotonic-context-menu', MessageContextMenu.prototype, 'render', function (_, res) {
    let { target, message: msg } = this.props;
    let compact = false;

    /*
     * Set the target to the highest element until we reach `containerCozy` so that
     * images and emojis can work as well
     */
    const setTarget = () => {
      do {
        if (target.matches('.pc-containerCozy')) {
          return target;
        }
        if (target.matches('.pc-containerCompact')) {
          compact = true;
          return target;
        }
        target = target.parentElement || target.parentNode;
      } while (target !== null && target.nodeType === 1);
    };
    setTarget();

    if (target !== document) {
      const perform = async (sendToChannel = true) => {
        const messages = [ ...(compact ? target.parentElement.parentElement : target.parentElement.parentElement.parentElement).children ]
          .filter(n => n.nodeName !== 'HR');
        const firstMessage = messages[0];

        // Hide any unnecessary messages for the screenshot
        target.style.minWidth = !compact ? '270px' : '500px';
        target.style.width = 'min-content';
        if (messages.length > 1) {
          if (target.parentElement !== firstMessage) {
            firstMessage.children[1].style.display = 'none';
          }

          for (const message of messages) {
            if (message !== target.parentElement.parentElement && message !== firstMessage) {
              message.style.display = 'none';
            }
          }
        }

        document.body.click();

        // Get position data for element
        const rect = target.getBoundingClientRect();

        // Take screenshot
        const screenshot = _this.getModule('Screenshot');
        const file = await screenshot(rect, { compact,
          messageID: msg.id });

        // Change all modified messages back to normal
        target.style.minWidth = '';
        target.style.width = '';
        if (messages.length > 1) {
          firstMessage.children[1].style.display = '';
          for (const message of messages) {
            if (message !== target.parentElement.parentElement) {
              message.style.display = '';
            }
          }
        }

        if (sendToChannel) {
          upload.upload(channels.getChannelId(), file, { content: '',
            invalidEmojis: [],
            tts: false }, false);
        } else {
          navigator.clipboard.write(file);
        }
      };
      res.props.children.push(
        React.createElement(Submenu, {
          name: 'Quote',
          hint: 'to',
          onClick: () => perform(true),
          getItems: () => [
            {
              name: 'this channel',
              type: 'button',
              onClick: () => perform(true)
            },
            {
              name: 'clipboard',
              type: 'button',
              onClick: () => perform(false)
            }
          ]
        }),
      );
    }

    return res;
  });
};
